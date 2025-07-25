import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./replitAuth";
// Schema validation removed - using basic validation
// Note: Stripe will be initialized when STRIPE_SECRET_KEY is provided

// Helper function to detect device type from user agent
function getDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
  if (/Tablet|iPad/.test(userAgent)) return 'tablet';
  return 'desktop';
}

// Generate random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// In-memory storage for trial users and invite codes
const trialUsers = new Map();
const inviteCodes = new Map();
const demoInvites = new Map();

// Premium user middleware
const premiumMiddleware = (req: any, res: any, next: any) => {
  if (req.user && req.user.subscriptionStatus === 'active') {
    next();
  } else {
    res.status(403).json({ message: 'Premium subscription required' });
  }
};

// Mock auth middleware for development
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'premium-user-123',
      email: 'premium@example.com',
      firstName: 'Premium',
      lastName: 'User',
      subscriptionStatus: 'active',
      requireAuth: true
    };
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication only in production
  if (process.env.NODE_ENV === 'production') {
    await setupAuth(app);
  }
  // Trial signup API
  app.post('/api/start-trial', async (req, res) => {
    const { email, inviteCode } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    // Check if email already has trial
    if (trialUsers.has(email)) {
      return res.status(400).json({ message: 'Email già utilizzata per trial' });
    }

    // Validate invite code if provided
    let inviteValid = true;
    if (inviteCode) {
      const invite = inviteCodes.get(inviteCode);
      if (!invite || !invite.active || invite.uses >= invite.maxUses || new Date() > new Date(invite.expiresAt)) {
        inviteValid = false;
      } else {
        // Increment usage
        invite.uses++;
        inviteCodes.set(inviteCode, invite);
      }
    }

    // Create trial user (5 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);
    
    const trialUser = {
      email,
      startedAt: new Date(),
      expiresAt,
      inviteCode: inviteCode || null,
      inviteValid,
      status: 'active'
    };
    
    trialUsers.set(email, trialUser);
    
    res.json({
      message: 'Trial attivato con successo',
      expiresAt,
      trialDays: 5,
      inviteUsed: !!inviteCode,
      inviteValid
    });
  });

  // Auth routes - removed duplicate, using trialAuthMiddleware below

  // Invite codes management
  app.get('/api/invite-codes', mockAuthMiddleware, async (req, res) => {
    const codes = Array.from(inviteCodes.values()).map(code => ({
      ...code,
      active: code.active && new Date() < new Date(code.expiresAt) && code.uses < code.maxUses
    }));
    res.json(codes);
  });

  app.post('/api/invite-codes', mockAuthMiddleware, async (req, res) => {
    const { maxUses, expiryDays } = req.body;
    
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    const inviteCode = {
      id: Date.now(),
      code,
      uses: 0,
      maxUses,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      active: true
    };
    
    inviteCodes.set(code, inviteCode);
    res.json(inviteCode);
  });

  // Trial authentication middleware
  const trialAuthMiddleware = (req: any, res: any, next: any) => {
    const email = req.headers['x-trial-email'];
    if (email && trialUsers.has(email)) {
      const trial = trialUsers.get(email);
      if (new Date() < new Date(trial.expiresAt)) {
        req.user = {
          id: `trial-${email}`,
          email,
          subscriptionStatus: 'trial',
          trialExpiresAt: trial.expiresAt,
          requireAuth: true
        };
        return next();
      }
    }
    return mockAuthMiddleware(req, res, next);
  };

  // Authentication routes with device tracking
  app.get('/api/auth/user', trialAuthMiddleware, async (req: any, res) => {
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const userWithDeviceInfo = {
      ...req.user,
      currentDevice: {
        userAgent,
        lastAccess: new Date(),
        deviceType: getDeviceType(userAgent)
      },
      multiDeviceAccess: true
    };
    res.json(userWithDeviceInfo);
  });

  // Device management API
  app.get('/api/devices', mockAuthMiddleware, async (req: any, res) => {
    // Mock device list for demonstration
    const devices = [
      {
        id: 1,
        name: 'Computer Desktop',
        type: 'desktop',
        lastAccess: new Date(),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        active: true
      },
      {
        id: 2,
        name: 'iPhone',
        type: 'mobile',
        lastAccess: new Date(Date.now() - 86400000), // 1 day ago
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        active: true
      }
    ];
    res.json(devices);
  });

  // Subscription management with multiple plans
  app.post('/api/get-or-create-subscription', mockAuthMiddleware, async (req: any, res) => {
    const { plan = 'monthly', amount } = req.body;
    
    const planConfigs = {
      monthly: { amount: 999, interval: 'month', name: 'Piano Mensile' },
      semester: { amount: 4000, interval: null, name: 'Piano Semestrale (6 mesi)' },
      lifetime: { amount: 2400, interval: null, name: 'Piano A Vita' }
    };
    
    const selectedPlan = planConfigs[plan as keyof typeof planConfigs] || planConfigs.monthly;
    
    // Store user device info for multi-device access
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceInfo = {
      userAgent,
      plan,
      accessTime: new Date(),
      multiDeviceEnabled: true
    };
    
    res.json({
      subscriptionId: `${plan}_${Date.now()}`,
      clientSecret: `pi_${plan}_demo_secret`,
      status: 'active',
      plan: selectedPlan,
      multiDeviceAccess: true,
      deviceInfo
    });
  });

  // Protected sessions routes (premium only)
  app.get("/api/sessions", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const strategy = req.query.strategy as string | undefined;
      const sessions = await storage.getAllSessions(strategy);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  app.post("/api/sessions", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const validatedData = req.body; // TODO: Add validation
      const newSession = await storage.createSession(validatedData);
      res.status(201).json(newSession);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data", error });
    }
  });

  app.patch("/api/sessions/:id", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.updateSession(id, req.body);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Failed to update session", error });
    }
  });

  app.delete("/api/sessions/:id", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const success = await storage.deleteSession(id);
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Bets routes (premium protected)
  app.get("/api/sessions/:sessionId/bets", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const bets = await storage.getBetsBySessionId(sessionId);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bets" });
    }
  });

  app.post("/api/sessions/:sessionId/bets", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const betData = { ...req.body, sessionId };
      const validatedData = betData; // TODO: Add validation
      
      const newBet = await storage.createBet(validatedData);

      // Update session with new bankroll and stats
      const updatedSession = await storage.updateSessionAfterBet(sessionId, newBet);
      
      res.status(201).json({ bet: newBet, session: updatedSession });
    } catch (error) {
      res.status(400).json({ message: "Invalid bet data", error });
    }
  });

  // Delete all bets for a session
  app.delete("/api/sessions/:sessionId/bets", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      // Verifica che la sessione esista
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Elimina tutte le scommesse (anche se non ce ne sono)
      await storage.deleteAllBetsForSession(sessionId);
      
      // Restituisce sempre successo se la sessione esiste
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bets" });
    }
  });

  // Delete a session completely
  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const success = await storage.deleteSession(sessionId);
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Payment Routes - Demo Mode
  // Create subscription endpoint (demo version)
  app.post('/api/create-subscription', mockAuthMiddleware, async (req, res) => {
    try {
      const { planId } = req.body;
      
      // Plan pricing mapping
      const plans = {
        basic: { priceId: 'price_basic_monthly', amount: 999, name: 'Basic Plan' },
        pro: { priceId: 'price_pro_monthly', amount: 1999, name: 'Pro Plan' },
        premium: { priceId: 'price_premium_monthly', amount: 2999, name: 'Premium Plan' }
      };

      const selectedPlan = plans[planId as keyof typeof plans];
      if (!selectedPlan) {
        return res.status(400).json({ message: 'Invalid plan selected' });
      }

      // Demo mode - return mock data without initializing Stripe
      res.json({
        clientSecret: null,
        message: `Demo Mode: ${selectedPlan.name} - In production, this would connect to Stripe for payment processing.`,
        plan: selectedPlan,
        demoMode: true
      });
    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  // Cancel subscription endpoint (demo mode)
  app.post('/api/cancel-subscription', mockAuthMiddleware, async (req, res) => {
    try {
      res.json({ 
        message: 'Demo Mode: Subscription cancellation would be processed here in production',
        demoMode: true
      });
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Stripe webhook endpoint for handling subscription events
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(200).json({ received: true });
      }

      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });

      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          const subscription = event.data.object;
          // Update user subscription status in database
          // This would require finding user by stripeCustomerId
          break;
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          break;
        case 'invoice.payment_succeeded':
          // Handle successful payment
          break;
        case 'invoice.payment_failed':
          // Handle failed payment
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Demo invite management API
  app.post('/api/create-demo-invite', mockAuthMiddleware, async (req, res) => {
    try {
      const { email, demoType, duration, features } = req.body;
      
      if (!email || !demoType) {
        return res.status(400).json({ message: 'Email e tipo demo richiesti' });
      }

      // Generate unique demo code
      const inviteCode = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (duration || 24));

      const demoInvite = {
        code: inviteCode,
        email,
        demoType,
        duration,
        features,
        createdAt: new Date(),
        expiresAt,
        usedAt: null,
        active: true,
        createdBy: (req.user as any)?.id || 'admin'
      };

      demoInvites.set(inviteCode, demoInvite);

      // Send email if SendGrid is configured
      let emailSent = false;
      if (process.env.SENDGRID_API_KEY) {
        try {
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);

          const demoTypeNames = {
            basic: 'Demo Base',
            interactive: 'Demo Interattiva', 
            showcase: 'Demo Showcase',
            full: 'Demo Completa'
          };

          const msg = {
            to: email,
            from: 'noreply@bettingapp.com', // Replace with your verified sender
            subject: `Invito Demo - ${(demoTypeNames as any)[demoType] || 'Demo'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">🎯 Invito Demo Esclusivo</h2>
                <p>Hai ricevuto un invito per accedere alla <strong>${(demoTypeNames as any)[demoType] || 'Demo'}</strong>.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>Codice di Accesso:</h3>
                  <div style="font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 2px; text-align: center;">
                    ${inviteCode}
                  </div>
                </div>

                <p><strong>Caratteristiche incluse:</strong></p>
                <ul>
                  ${features.map((feature: string) => `<li>${feature}</li>`).join('')}
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${req.protocol}://${req.get('host')}/demo/${inviteCode}" 
                     style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Accedi alla Demo
                  </a>
                </div>

                <p style="color: #666; font-size: 14px;">
                  Questo invito scade il ${expiresAt.toLocaleDateString('it-IT')} alle ${expiresAt.toLocaleTimeString('it-IT')}.
                </p>
              </div>
            `
          };

          await sgMail.send(msg);
          emailSent = true;
          console.log(`Demo invite email sent to ${email}: ${inviteCode}`);
        } catch (error) {
          console.error('Error sending email:', error);
          // Continue without email - just log the code
        }
      }

      if (!emailSent) {
        console.log(`Demo invite created for ${email}: ${inviteCode} (email not sent - SendGrid not configured)`);
      }

      res.json({
        inviteCode,
        email,
        expiresAt,
        emailSent,
        demoUrl: `${req.protocol}://${req.get('host')}/demo/${inviteCode}`
      });
    } catch (error) {
      console.error('Error creating demo invite:', error);
      res.status(500).json({ message: 'Errore nella creazione invito demo' });
    }
  });

  // Validate demo invite
  app.post('/api/validate-demo', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Codice demo richiesto' });
      }

      const invite = demoInvites.get(code);
      
      if (!invite) {
        return res.status(404).json({ message: 'Codice demo non valido' });
      }

      if (!invite.active || new Date() > new Date(invite.expiresAt)) {
        return res.status(410).json({ message: 'Codice demo scaduto' });
      }

      // Mark as used
      invite.usedAt = new Date();
      demoInvites.set(code, invite);

      res.json({
        valid: true,
        demoType: invite.demoType,
        features: invite.features,
        expiresAt: invite.expiresAt,
        email: invite.email
      });
    } catch (error) {
      console.error('Error validating demo:', error);
      res.status(500).json({ message: 'Errore validazione demo' });
    }
  });

  // Demo-protected betting strategies endpoints
  app.post('/api/demo/calculate-bet', async (req, res) => {
    try {
      const { strategy, bankroll, odds, demoCode } = req.body;
      
      // Validate demo access
      const invite = demoInvites.get(demoCode);
      if (!invite || !invite.active || new Date() > new Date(invite.expiresAt)) {
        return res.status(403).json({ message: 'Accesso demo non autorizzato' });
      }

      // Protected calculations - simplified versions
      let stake = 0;
      let reasoning = "Calcolo demo semplificato";

      switch (strategy) {
        case 'percentage':
          stake = bankroll * 0.02; // Fixed 2% instead of real formula
          reasoning = "Demo: Puntata fissa al 2% del bankroll";
          break;
        case 'kelly':
          stake = bankroll * 0.05; // Simplified Kelly without real edge calculation
          reasoning = "Demo: Kelly semplificato senza calcolo edge reale";
          break;
        case 'profitfall':
          stake = Math.min(bankroll * 0.1, 100); // Simplified without real loss recovery
          reasoning = "Demo: Profit Fall semplificato senza recupero perdite reale";
          break;
        case 'beat-delay':
          stake = bankroll * 0.03; // Basic percentage instead of ML prediction
          reasoning = "Demo: Beat Delay senza predizione ML";
          break;
        default:
          stake = bankroll * 0.02;
      }

      res.json({
        stake: Math.round(stake * 100) / 100,
        reasoning,
        warning: "⚠️ VERSIONE DEMO - Calcoli semplificati per protezione IP",
        demoType: invite.demoType
      });
    } catch (error) {
      console.error('Error in demo calculation:', error);
      res.status(500).json({ message: 'Errore calcolo demo' });
    }
  });

  // List active demo invites (admin only)
  app.get('/api/demo-invites', mockAuthMiddleware, async (req, res) => {
    try {
      const invites = Array.from(demoInvites.values())
        .filter(invite => invite.createdBy === (req.user as any)?.id || (req.user as any)?.role === 'admin')
        .map(invite => ({
          code: invite.code,
          email: invite.email,
          demoType: invite.demoType,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          usedAt: invite.usedAt,
          active: invite.active && new Date() < new Date(invite.expiresAt)
        }));

      res.json(invites);
    } catch (error) {
      console.error('Error fetching demo invites:', error);
      res.status(500).json({ message: 'Errore recupero inviti demo' });
    }
  });

  // ===== BEAT THE DELAY SESSIONS API =====
  
  // Get all Beat the Delay sessions
  app.get("/api/beat-delay-sessions", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessions = await storage.getAllBeatDelaySessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error getting Beat the Delay sessions:', error);
      res.status(500).json({ message: "Failed to get Beat the Delay sessions" });
    }
  });

  // Get specific Beat the Delay session with bets
  app.get("/api/beat-delay-sessions/:id", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getBeatDelaySession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const bets = await storage.getBeatDelayBets(id);
      res.json({ session, bets });
    } catch (error) {
      console.error('Error getting Beat the Delay session:', error);
      res.status(500).json({ message: "Failed to get Beat the Delay session" });
    }
  });

  // Create new Beat the Delay session
  app.post("/api/beat-delay-sessions", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessionData = req.body;
      
      // Basic validation
      if (!sessionData.sessionName || !sessionData.initialBankroll || !sessionData.baseStake) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const session = await storage.createBeatDelaySession(sessionData);
      res.json(session);
    } catch (error) {
      console.error('Error creating Beat the Delay session:', error);
      res.status(500).json({ message: "Failed to create Beat the Delay session" });
    }
  });

  // Update Beat the Delay session
  app.patch("/api/beat-delay-sessions/:id", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const updates = req.body;
      const session = await storage.updateBeatDelaySession(id, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error('Error updating Beat the Delay session:', error);
      res.status(500).json({ message: "Failed to update Beat the Delay session" });
    }
  });

  // Delete Beat the Delay session
  app.delete("/api/beat-delay-sessions/:id", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      await storage.deleteBeatDelaySession(id);
      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error('Error deleting Beat the Delay session:', error);
      res.status(500).json({ message: "Failed to delete Beat the Delay session" });
    }
  });

  // Add bet to Beat the Delay session
  app.post("/api/beat-delay-sessions/:id/bets", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const betData = req.body;
      
      // Basic validation
      if (typeof betData.win !== 'boolean' || !betData.stake || !betData.odds) {
        return res.status(400).json({ message: "Missing required bet fields" });
      }

      const result = await storage.addBeatDelayBet(sessionId, betData);
      res.json(result);
    } catch (error) {
      console.error('Error adding Beat the Delay bet:', error);
      res.status(500).json({ message: "Failed to add Beat the Delay bet" });
    }
  });

  // Get bets for specific Beat the Delay session
  app.get("/api/beat-delay-sessions/:id/bets", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const bets = await storage.getBeatDelayBets(sessionId);
      res.json(bets);
    } catch (error) {
      console.error('Error getting Beat the Delay bets:', error);
      res.status(500).json({ message: "Failed to get Beat the Delay bets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

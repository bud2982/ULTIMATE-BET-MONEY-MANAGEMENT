var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  authSessions: () => authSessions,
  bets: () => bets,
  insertBetSchema: () => insertBetSchema,
  insertBettingSessionSchema: () => insertBettingSessionSchema,
  sessions: () => sessions,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var authSessions = pgTable(
  "auth_sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  // active, inactive, canceled
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var sessions = pgTable("betting_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  initialBankroll: doublePrecision("initial_bankroll").notNull(),
  currentBankroll: doublePrecision("current_bankroll").notNull(),
  targetReturn: doublePrecision("target_return").notNull(),
  strategy: text("strategy").notNull(),
  // 'flat', 'percentage', 'dalembert', 'masaniello'
  betCount: integer("bet_count").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  strategySettings: text("strategy_settings").notNull()
});
var bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  betNumber: integer("bet_number").notNull(),
  stake: doublePrecision("stake").notNull(),
  odds: doublePrecision("odds").notNull(),
  potentialWin: doublePrecision("potential_win").notNull(),
  win: boolean("win").notNull(),
  bankrollBefore: doublePrecision("bankroll_before").notNull(),
  bankrollAfter: doublePrecision("bankroll_after").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertBettingSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  createdAt: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var AuthMemoryStorage = class {
  users = [];
  sessions = [];
  bets = [];
  nextSessionId = 1;
  nextBetId = 1;
  // User operations for Replit Auth
  async getUser(id) {
    return this.users.find((u) => u.id === id);
  }
  async upsertUser(userData) {
    const existingIndex = this.users.findIndex((u) => u.id === userData.id);
    const user = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      stripeCustomerId: userData.stripeCustomerId || null,
      stripeSubscriptionId: userData.stripeSubscriptionId || null,
      subscriptionStatus: userData.subscriptionStatus || "inactive",
      subscriptionEndsAt: userData.subscriptionEndsAt || null,
      createdAt: userData.createdAt || /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (existingIndex >= 0) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }
    return user;
  }
  async updateUserSubscription(id, subscription) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    this.users[userIndex] = { ...this.users[userIndex], ...subscription, updatedAt: /* @__PURE__ */ new Date() };
    return this.users[userIndex];
  }
  // Session operations
  async getAllSessions(strategy) {
    if (strategy) {
      return this.sessions.filter((s) => s.strategy === strategy);
    }
    return [...this.sessions];
  }
  async getSession(id) {
    return this.sessions.find((s) => s.id === id);
  }
  async createSession(insertSession) {
    const session2 = {
      id: this.nextSessionId++,
      userId: insertSession.userId ?? null,
      name: insertSession.name,
      initialBankroll: insertSession.initialBankroll,
      currentBankroll: insertSession.currentBankroll,
      targetReturn: insertSession.targetReturn,
      strategy: insertSession.strategy,
      betCount: insertSession.betCount || 0,
      wins: insertSession.wins || 0,
      losses: insertSession.losses || 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      strategySettings: insertSession.strategySettings
    };
    this.sessions.push(session2);
    return session2;
  }
  async updateSession(id, updatedFields) {
    const sessionIndex = this.sessions.findIndex((s) => s.id === id);
    if (sessionIndex === -1) return void 0;
    this.sessions[sessionIndex] = { ...this.sessions[sessionIndex], ...updatedFields, updatedAt: /* @__PURE__ */ new Date() };
    return this.sessions[sessionIndex];
  }
  async deleteSession(id) {
    const sessionIndex = this.sessions.findIndex((s) => s.id === id);
    if (sessionIndex === -1) return false;
    this.sessions.splice(sessionIndex, 1);
    await this.deleteAllBetsForSession(id);
    return true;
  }
  // Bet operations
  async getBetsBySessionId(sessionId) {
    return this.bets.filter((b) => b.sessionId === sessionId);
  }
  async createBet(insertBet) {
    const bet = {
      id: this.nextBetId++,
      sessionId: insertBet.sessionId ?? null,
      betNumber: insertBet.betNumber,
      stake: insertBet.stake,
      odds: insertBet.odds,
      potentialWin: insertBet.potentialWin,
      win: insertBet.win,
      bankrollBefore: insertBet.bankrollBefore,
      bankrollAfter: insertBet.bankrollAfter,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.bets.push(bet);
    return bet;
  }
  async updateSessionAfterBet(sessionId, bet) {
    const session2 = await this.getSession(sessionId);
    if (!session2) throw new Error("Session not found");
    const updatedSession = {
      ...session2,
      currentBankroll: bet.bankrollAfter,
      betCount: session2.betCount + 1,
      wins: bet.win ? session2.wins + 1 : session2.wins,
      losses: bet.win ? session2.losses : session2.losses + 1,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.updateSession(sessionId, updatedSession);
    return updatedSession;
  }
  async deleteAllBetsForSession(sessionId) {
    const beforeLength = this.bets.length;
    this.bets = this.bets.filter((b) => b.sessionId !== sessionId);
    return this.bets.length < beforeLength;
  }
};
var storage = new AuthMemoryStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (process.env.NODE_ENV === "production" && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "auth_sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}

// server/routes.ts
function getDeviceType(userAgent) {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return "mobile";
  if (/Tablet|iPad/.test(userAgent)) return "tablet";
  return "desktop";
}
function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
var trialUsers = /* @__PURE__ */ new Map();
var inviteCodes = /* @__PURE__ */ new Map();
var demoInvites = /* @__PURE__ */ new Map();
var premiumMiddleware = (req, res, next) => {
  if (req.user && req.user.subscriptionStatus === "active") {
    next();
  } else {
    res.status(403).json({ message: "Premium subscription required" });
  }
};
var mockAuthMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    req.user = {
      id: "premium-user-123",
      email: "premium@example.com",
      firstName: "Premium",
      lastName: "User",
      subscriptionStatus: "active",
      isAuthenticated: true
    };
  }
  next();
};
async function registerRoutes(app2) {
  if (process.env.NODE_ENV === "production") {
    await setupAuth(app2);
  }
  app2.post("/api/start-trial", async (req, res) => {
    const { email, inviteCode } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }
    if (trialUsers.has(email)) {
      return res.status(400).json({ message: "Email gi\xE0 utilizzata per trial" });
    }
    let inviteValid = true;
    if (inviteCode) {
      const invite = inviteCodes.get(inviteCode);
      if (!invite || !invite.active || invite.uses >= invite.maxUses || /* @__PURE__ */ new Date() > new Date(invite.expiresAt)) {
        inviteValid = false;
      } else {
        invite.uses++;
        inviteCodes.set(inviteCode, invite);
      }
    }
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);
    const trialUser = {
      email,
      startedAt: /* @__PURE__ */ new Date(),
      expiresAt,
      inviteCode: inviteCode || null,
      inviteValid,
      status: "active"
    };
    trialUsers.set(email, trialUser);
    res.json({
      message: "Trial attivato con successo",
      expiresAt,
      trialDays: 5,
      inviteUsed: !!inviteCode,
      inviteValid
    });
  });
  app2.get("/api/invite-codes", mockAuthMiddleware, async (req, res) => {
    const codes = Array.from(inviteCodes.values()).map((code) => ({
      ...code,
      active: code.active && /* @__PURE__ */ new Date() < new Date(code.expiresAt) && code.uses < code.maxUses
    }));
    res.json(codes);
  });
  app2.post("/api/invite-codes", mockAuthMiddleware, async (req, res) => {
    const { maxUses, expiryDays } = req.body;
    const code = generateInviteCode();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    const inviteCode = {
      id: Date.now(),
      code,
      uses: 0,
      maxUses,
      expiresAt: expiresAt.toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      active: true
    };
    inviteCodes.set(code, inviteCode);
    res.json(inviteCode);
  });
  const trialAuthMiddleware = (req, res, next) => {
    const email = req.headers["x-trial-email"];
    if (email && trialUsers.has(email)) {
      const trial = trialUsers.get(email);
      if (/* @__PURE__ */ new Date() < new Date(trial.expiresAt)) {
        req.user = {
          id: `trial-${email}`,
          email,
          subscriptionStatus: "trial",
          trialExpiresAt: trial.expiresAt,
          isAuthenticated: true
        };
        return next();
      }
    }
    return mockAuthMiddleware(req, res, next);
  };
  app2.get("/api/auth/user", trialAuthMiddleware, async (req, res) => {
    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const userWithDeviceInfo = {
      ...req.user,
      currentDevice: {
        userAgent,
        lastAccess: /* @__PURE__ */ new Date(),
        deviceType: getDeviceType(userAgent)
      },
      multiDeviceAccess: true
    };
    res.json(userWithDeviceInfo);
  });
  app2.get("/api/devices", mockAuthMiddleware, async (req, res) => {
    const devices = [
      {
        id: 1,
        name: "Computer Desktop",
        type: "desktop",
        lastAccess: /* @__PURE__ */ new Date(),
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        active: true
      },
      {
        id: 2,
        name: "iPhone",
        type: "mobile",
        lastAccess: new Date(Date.now() - 864e5),
        // 1 day ago
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)",
        active: true
      }
    ];
    res.json(devices);
  });
  app2.post("/api/get-or-create-subscription", mockAuthMiddleware, async (req, res) => {
    const { plan = "monthly", amount } = req.body;
    const planConfigs = {
      monthly: { amount: 999, interval: "month", name: "Piano Mensile" },
      semester: { amount: 4e3, interval: null, name: "Piano Semestrale (6 mesi)" },
      lifetime: { amount: 2400, interval: null, name: "Piano A Vita" }
    };
    const selectedPlan = planConfigs[plan] || planConfigs.monthly;
    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const deviceInfo = {
      userAgent,
      plan,
      accessTime: /* @__PURE__ */ new Date(),
      multiDeviceEnabled: true
    };
    res.json({
      subscriptionId: `${plan}_${Date.now()}`,
      clientSecret: `pi_${plan}_demo_secret`,
      status: "active",
      plan: selectedPlan,
      multiDeviceAccess: true,
      deviceInfo
    });
  });
  app2.get("/api/sessions", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const strategy = req.query.strategy;
      const sessions2 = await storage.getAllSessions(strategy);
      res.json(sessions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });
  app2.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      const session2 = await storage.getSession(id);
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });
  app2.post("/api/sessions", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const validatedData = insertBettingSessionSchema.parse(req.body);
      const newSession = await storage.createSession(validatedData);
      res.status(201).json(newSession);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data", error });
    }
  });
  app2.patch("/api/sessions/:id", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      const session2 = await storage.updateSession(id, req.body);
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session2);
    } catch (error) {
      res.status(400).json({ message: "Failed to update session", error });
    }
  });
  app2.delete("/api/sessions/:id", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
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
  app2.get("/api/sessions/:sessionId/bets", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      const bets2 = await storage.getBetsBySessionId(sessionId);
      res.json(bets2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bets" });
    }
  });
  app2.post("/api/sessions/:sessionId/bets", mockAuthMiddleware, premiumMiddleware, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      const session2 = await storage.getSession(sessionId);
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      const betData = { ...req.body, sessionId };
      const validatedData = insertBetSchema.parse(betData);
      const newBet = await storage.createBet(validatedData);
      const updatedSession = await storage.updateSessionAfterBet(sessionId, newBet);
      res.status(201).json({ bet: newBet, session: updatedSession });
    } catch (error) {
      res.status(400).json({ message: "Invalid bet data", error });
    }
  });
  app2.delete("/api/sessions/:sessionId/bets", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      const session2 = await storage.getSession(sessionId);
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      await storage.deleteAllBetsForSession(sessionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bets" });
    }
  });
  app2.delete("/api/sessions/:sessionId", async (req, res) => {
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
  app2.post("/api/create-subscription", mockAuthMiddleware, async (req, res) => {
    try {
      const { planId } = req.body;
      const plans = {
        basic: { priceId: "price_basic_monthly", amount: 999, name: "Basic Plan" },
        pro: { priceId: "price_pro_monthly", amount: 1999, name: "Pro Plan" },
        premium: { priceId: "price_premium_monthly", amount: 2999, name: "Premium Plan" }
      };
      const selectedPlan = plans[planId];
      if (!selectedPlan) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }
      res.json({
        clientSecret: null,
        message: `Demo Mode: ${selectedPlan.name} - In production, this would connect to Stripe for payment processing.`,
        plan: selectedPlan,
        demoMode: true
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });
  app2.post("/api/cancel-subscription", mockAuthMiddleware, async (req, res) => {
    try {
      res.json({
        message: "Demo Mode: Subscription cancellation would be processed here in production",
        demoMode: true
      });
    } catch (error) {
      console.error("Subscription cancellation error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
  app2.post("/api/stripe-webhook", async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(200).json({ received: true });
      }
      const Stripe = __require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16"
      });
      const sig = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      switch (event.type) {
        case "customer.subscription.updated":
        case "customer.subscription.created":
          const subscription = event.data.object;
          break;
        case "customer.subscription.deleted":
          break;
        case "invoice.payment_succeeded":
          break;
        case "invoice.payment_failed":
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });
  app2.post("/api/create-demo-invite", mockAuthMiddleware, async (req, res) => {
    try {
      const { email, demoType, duration, features } = req.body;
      if (!email || !demoType) {
        return res.status(400).json({ message: "Email e tipo demo richiesti" });
      }
      const inviteCode = generateInviteCode();
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setHours(expiresAt.getHours() + (duration || 24));
      const demoInvite = {
        code: inviteCode,
        email,
        demoType,
        duration,
        features,
        createdAt: /* @__PURE__ */ new Date(),
        expiresAt,
        usedAt: null,
        active: true,
        createdBy: req.user?.id || "admin"
      };
      demoInvites.set(inviteCode, demoInvite);
      let emailSent = false;
      if (process.env.SENDGRID_API_KEY) {
        try {
          const sgMail = __require("@sendgrid/mail");
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const demoTypeNames = {
            basic: "Demo Base",
            interactive: "Demo Interattiva",
            showcase: "Demo Showcase",
            full: "Demo Completa"
          };
          const msg = {
            to: email,
            from: "noreply@bettingapp.com",
            // Replace with your verified sender
            subject: `Invito Demo - ${demoTypeNames[demoType] || "Demo"}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">\u{1F3AF} Invito Demo Esclusivo</h2>
                <p>Hai ricevuto un invito per accedere alla <strong>${demoTypeNames[demoType] || "Demo"}</strong>.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>Codice di Accesso:</h3>
                  <div style="font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 2px; text-align: center;">
                    ${inviteCode}
                  </div>
                </div>

                <p><strong>Caratteristiche incluse:</strong></p>
                <ul>
                  ${features.map((feature) => `<li>${feature}</li>`).join("")}
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${req.protocol}://${req.get("host")}/demo/${inviteCode}" 
                     style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Accedi alla Demo
                  </a>
                </div>

                <p style="color: #666; font-size: 14px;">
                  Questo invito scade il ${expiresAt.toLocaleDateString("it-IT")} alle ${expiresAt.toLocaleTimeString("it-IT")}.
                </p>
              </div>
            `
          };
          await sgMail.send(msg);
          emailSent = true;
          console.log(`Demo invite email sent to ${email}: ${inviteCode}`);
        } catch (error) {
          console.error("Error sending email:", error);
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
        demoUrl: `${req.protocol}://${req.get("host")}/demo/${inviteCode}`
      });
    } catch (error) {
      console.error("Error creating demo invite:", error);
      res.status(500).json({ message: "Errore nella creazione invito demo" });
    }
  });
  app2.post("/api/validate-demo", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Codice demo richiesto" });
      }
      const invite = demoInvites.get(code);
      if (!invite) {
        return res.status(404).json({ message: "Codice demo non valido" });
      }
      if (!invite.active || /* @__PURE__ */ new Date() > new Date(invite.expiresAt)) {
        return res.status(410).json({ message: "Codice demo scaduto" });
      }
      invite.usedAt = /* @__PURE__ */ new Date();
      demoInvites.set(code, invite);
      res.json({
        valid: true,
        demoType: invite.demoType,
        features: invite.features,
        expiresAt: invite.expiresAt,
        email: invite.email
      });
    } catch (error) {
      console.error("Error validating demo:", error);
      res.status(500).json({ message: "Errore validazione demo" });
    }
  });
  app2.post("/api/demo/calculate-bet", async (req, res) => {
    try {
      const { strategy, bankroll, odds, demoCode } = req.body;
      const invite = demoInvites.get(demoCode);
      if (!invite || !invite.active || /* @__PURE__ */ new Date() > new Date(invite.expiresAt)) {
        return res.status(403).json({ message: "Accesso demo non autorizzato" });
      }
      let stake = 0;
      let reasoning = "Calcolo demo semplificato";
      switch (strategy) {
        case "percentage":
          stake = bankroll * 0.02;
          reasoning = "Demo: Puntata fissa al 2% del bankroll";
          break;
        case "kelly":
          stake = bankroll * 0.05;
          reasoning = "Demo: Kelly semplificato senza calcolo edge reale";
          break;
        case "profitfall":
          stake = Math.min(bankroll * 0.1, 100);
          reasoning = "Demo: Profit Fall semplificato senza recupero perdite reale";
          break;
        case "beat-delay":
          stake = bankroll * 0.03;
          reasoning = "Demo: Beat Delay senza predizione ML";
          break;
        default:
          stake = bankroll * 0.02;
      }
      res.json({
        stake: Math.round(stake * 100) / 100,
        reasoning,
        warning: "\u26A0\uFE0F VERSIONE DEMO - Calcoli semplificati per protezione IP",
        demoType: invite.demoType
      });
    } catch (error) {
      console.error("Error in demo calculation:", error);
      res.status(500).json({ message: "Errore calcolo demo" });
    }
  });
  app2.get("/api/demo-invites", mockAuthMiddleware, async (req, res) => {
    try {
      const invites = Array.from(demoInvites.values()).filter((invite) => invite.createdBy === req.user?.id || req.user?.role === "admin").map((invite) => ({
        code: invite.code,
        email: invite.email,
        demoType: invite.demoType,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        usedAt: invite.usedAt,
        active: invite.active && /* @__PURE__ */ new Date() < new Date(invite.expiresAt)
      }));
      res.json(invites);
    } catch (error) {
      console.error("Error fetching demo invites:", error);
      res.status(500).json({ message: "Errore recupero inviti demo" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server }
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 5e3;
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";
  server.listen({
    port,
    host,
    reusePort: process.platform !== "win32"
    // reusePort non supportato su Windows
  }, () => {
    log(`serving on ${host}:${port}`);
  });
})();

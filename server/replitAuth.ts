import * as client from "openid-client";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Simplified auth without complex OIDC for now
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());
  
  // Simple mock auth for development
  app.get("/auth/login", (req, res) => {
    (req.session as any).user = {
      id: "dev-user",
      email: "dev@example.com",
      firstName: "Dev",
      lastName: "User",
      subscriptionStatus: "active" // Aggiungi status premium per testing
    };
    res.redirect("/");
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if ((req.session as any)?.user) {
    // Assicurati che l'utente abbia lo status premium per testing
    if (!(req.session as any).user.subscriptionStatus) {
      (req.session as any).user.subscriptionStatus = "active";
    }
    req.user = (req.session as any).user;
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

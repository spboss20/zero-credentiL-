import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { User, UserRole } from '../../src/types/index.ts';
import { db } from '../db.ts';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['holder', 'issuer', 'verifier', 'admin']).optional(),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['holder', 'issuer', 'verifier', 'admin']),
  organization: z.string().optional(),
});

// Middleware to extract user session
export function getAuthenticatedUser(req: any): User | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

  if (!token) return null;

  const session = db.sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) db.sessions.delete(token);
    return null;
  }

  return db.users.get(session.userId) || null;
}

export function requireAuth(req: any, res: any, next: any) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Valid authentication session required' });
  }
  req.user = user;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: any, res: any, next: any) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Forbidden: Role '${user.role}' is not authorized for this operation. Required: [${allowedRoles.join(', ')}]`,
      });
    }
    req.user = user;
    next();
  };
}

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid login payload', details: result.error.issues });
  }

  const { email, role } = result.data;
  // Look up user by email (and optional role)
  let user = Array.from(db.users.values()).find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && (!role || u.role === role)
  );

  // If testing with a seeded role email or quick login
  if (!user) {
    // For demo & quick testing, if email exists with another role, pick that
    user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  db.sessions.set(token, { userId: user.id, expiresAt });

  res.json({
    token,
    user,
  });
});

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.issues });
  }

  const { name, email, role, organization } = result.data;

  // Check existing
  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const did = `did:zeropass:${role}-${crypto.randomUUID().slice(0, 8)}`;

  const newUser: User = {
    id,
    email,
    name,
    role,
    did,
    organization: organization || (role === 'issuer' ? 'Accredited Issuer' : undefined),
    createdAt: new Date().toISOString(),
  };

  db.users.set(id, newUser);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.sessions.set(token, { userId: id, expiresAt });

  res.status(201).json({
    token,
    user: newUser,
  });
});

// GET /api/auth/me
authRouter.get('/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    // Return default holder for seamless initial exploration if token missing
    const defaultHolder = Array.from(db.users.values()).find((u) => u.role === 'holder');
    return res.json({ user: defaultHolder || null, authenticated: Boolean(defaultHolder) });
  }
  res.json({ user, authenticated: true });
});

// POST /api/auth/switch-role (Convenient for testing Issuer / Holder / Verifier roles)
authRouter.post('/switch-role', (req, res) => {
  const { role } = req.body;
  if (!['holder', 'issuer', 'verifier', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const targetUser = Array.from(db.users.values()).find((u) => u.role === role);
  if (!targetUser) {
    return res.status(404).json({ error: `No seeded account found for role ${role}` });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.sessions.set(token, { userId: targetUser.id, expiresAt });

  res.json({
    token,
    user: targetUser,
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    db.sessions.delete(token);
  }
  res.json({ success: true });
});

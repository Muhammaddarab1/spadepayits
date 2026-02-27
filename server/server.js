// Express server entrypoint for Ticket Management System
// - Loads environment variables
// - Configures CORS for cross-domain auth (Render + Vercel)
// - Wires API routes
// - Seeds baseline roles and an initial Admin user
// - Connects to MongoDB (Atlas in prod, memory fallback in dev if SRV DNS fails)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import path from 'path';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import ticketRoutes from './routes/tickets.js';
import activityLogRoutes from './routes/activityLogs.js';
import User from './models/User.js';
import Role from './models/Role.js';
import crypto from 'crypto';
import attendanceRoutes from './routes/attendance.js';
import rolesRoutes from './routes/roles.js';
import reportsRoutes from './routes/reports.js';
import tagsRoutes from './routes/tags.js';
import salesRoutes from './routes/sales.js';

const app = express();

<<<<<<< HEAD
const parseOrigin = (u) => {
  if (!u) return null;
  try {
    return new URL(u).origin;
  } catch {
    return u.replace(/\/.*/, '');
  }
};
const allowedOrigins = [
  parseOrigin(process.env.CLIENT_URL),
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => parseOrigin(s.trim()))
    .filter(Boolean),
].filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const o = parseOrigin(origin);
      const allowed = allowedOrigins.includes(o);
      return cb(allowed ? null : new Error('CORS not allowed'), allowed);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token'],
    exposedHeaders: ['X-Auth-Token'],
=======
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
>>>>>>> ab00bbb5c5a44277562d207c325489da90ca5df4
  })
);
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Base health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Friendly root info page for browsers
app.get('/', (_req, res) => {
  res
    .type('html')
    .send(
      '<!doctype html><meta charset="utf-8"/><title>Ticket API</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:2rem;line-height:1.5}a{color:#0ea5e9;text-decoration:none}</style><h1>Ticket API</h1><p>Backend is running.</p><p>Health check: <a href="/api/health">/api/health</a></p>'
    );
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/activityLogs', activityLogRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/sales', salesRoutes);

// Global error handler (minimal)
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Seed initial admin on first launch
const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existing = await User.findOne({ email });
  const passwordPlain = process.env.ADMIN_PASSWORD || 'Admin@12345';
  if (existing) {
    if (process.env.ADMIN_FORCE_RESET === 'true') {
      existing.password = passwordPlain;
      existing.role = 'Admin';
      await existing.save();
      console.log('====================================================');
      console.log('Admin account password reset');
      console.log(`Email: ${email}`);
      console.log(`Temporary Password: ${passwordPlain}`);
      console.log('====================================================');
    }
    return existing;
  }
  const admin = await User.create({ name: 'Initial Admin', email, password: passwordPlain, role: 'Admin' });
  console.log('====================================================');
  console.log('Initial admin account created');
  console.log(`Email: ${email}`);
  console.log(`Temporary Password: ${passwordPlain}`);
  console.log('Please login and change the password immediately.');
  console.log('====================================================');
  return admin;
};
// Seed default roles with baseline permissions
const seedRoles = async () => {
  const defaultRoles = [
    {
      name: 'Admin',
      permissions: {
        'tickets.create': true,
        'tickets.update': true,
        'tickets.delete': true,
        'tickets.viewDeleted': true,
        'tickets.viewAll': true,
        'reports.generate': true,
        'tags.manage': true,
        'sales.create': true,
        'sales.update': true,
        'sales.delete': true,
        'sales.viewAll': true,
        'users.manage': true,
        'roles.manage': true,
        'accounts.delete': true,
        'members.add': true,
      },
      description: 'Superuser with all permissions',
    },
    {
      name: 'User',
      permissions: {
        'tickets.viewAll': true,
        'tickets.create': true,
        'tickets.update': true,
        'sales.create': true,
        'sales.update': true,
      },
      description: 'Baseline role with no implicit permissions',
    },
    {
      name: 'HR',
      permissions: {
        'attendance.report': true,
        'roles.manage': true, // editable if Admin allows
      },
      description: 'Human Resources',
    },
    {
      name: 'Operational',
      permissions: {
        'members.add': true,
      },
      description: 'Operational team',
    },
    {
      name: 'Agent',
      permissions: {
        'tickets.create': true,
        'tickets.viewAll': true,
        'sales.create': true,
        'sales.update': true,
      },
      description: 'Support agent',
    },
    {
      name: 'Sales',
      permissions: {
        'tickets.create': true,
        'attendance.record': true,
      },
      description: 'Sales team',
    },
    {
      name: 'Finance',
      permissions: {
        'tickets.create': true,
        'attendance.record': true,
      },
      description: 'Finance team',
    },
  ];
  for (const r of defaultRoles) {
    await Role.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true });
  }
};

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}

const start = async () => {
  console.log(`Booting server with MONGO_URI=${MONGO_URI} CLIENT_URL=${process.env.CLIENT_URL}`);
  try {
    await connectDB(MONGO_URI);
  } catch (e) {
    const msg = (e && e.message) || '';
    const isSrv = MONGO_URI?.includes('mongodb+srv');
    const looksDnsSrvIssue = isSrv && /querySrv/i.test(msg);
    if (looksDnsSrvIssue) {
      console.warn('SRV DNS resolution failed locally; falling back to in-memory MongoDB for dev.');
      await connectDB('memory');
    } else {
      throw e;
    }
  }
  await seedRoles();
  await seedAdmin();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

// Ensure clean shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

start();

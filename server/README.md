# Ticket Management System – Backend (Server)

## Overview
Node.js + Express + MongoDB backend for the internal Ticket Management System. Provides JWT auth, role-based access control, ticket CRUD, activity logs, and forgot/reset password.

## Routes
- `/api/auth` – Register, Login, Forgot Password, Reset Password
- `/api/users` – List users (Admin), Get profile
- `/api/tickets` – Ticket CRUD and status updates
- `/api/activityLogs` – Activity history (Admin/Sales/Finance)

## Environment
Copy `.env.example` to `.env` and fill values.

## Scripts
- `npm start` – Start production server
- `npm run dev` – Start with nodemon (development)

## Deployment
Compatible with Render/Railway/Fly.io free tiers.
1. Set environment variables from `.env.example`.
2. Set Start Command: `npm start`.
3. Add `CLIENT_URL` with your frontend URL for CORS and reset links.
4. On first boot, an initial Admin account is created:
   - Email: `muhammaddarab786@gmail.com`
   - A random temporary password is printed once in logs.
   - Login and change it immediately.

## Notes
- No hardcoded URLs; all external links use `CLIENT_URL`.
- Password reset tokens expire in 1 hour.

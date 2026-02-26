# Ticket Management MERN App

This is a production-ready MERN application for ticketing and sales workflows. It uses a Node/Express backend (Server) and a React + Vite frontend (Client) with MongoDB (Atlas in production, memory fallback for local development).

## Tech Stack
- Backend: Node.js, Express, Mongoose
- Frontend: React, Vite, TailwindCSS
- Auth: JWT issued via HTTP-only cookies (cross-domain friendly)
- Database: MongoDB Atlas (production), mongodb-memory-server (local fallback)
- Deployment: Backend on Render, Frontend on Vercel

## Key Design
- Cookie-based authentication
  - Backend sets a JWT cookie on login. Dev uses `SameSite=lax`, prod uses `SameSite=none` + `Secure`.
  - Frontend requests include credentials; CORS allows only the configured `CLIENT_URL`.
- CORS configuration
  - Server reads `CLIENT_URL` and allows cookies from that origin, for Render/Vercel interoperability.
- DB connection strategy
  - In production, connects to Atlas via `MONGO_URI`.
  - In local dev, if Atlas SRV DNS fails on Windows, the server falls back to an embedded in-memory MongoDB to keep you moving.

## Local Development
1. Create environment files (do not commit them):
   - `server/.env`:
     ```
     PORT=5001
     MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
     JWT_SECRET=dev_jwt_secret_change_me
     CLIENT_URL=http://localhost:5173
     NODE_ENV=development
     ```
     Optional email settings:
     ```
     EMAIL_HOST=
     EMAIL_PORT=
     EMAIL_USER=
     EMAIL_PASS=
     ```
   - `client/.env`:
     ```
     VITE_API_URL=
     ```
     The dev server uses a proxy for `/api`, so this can be empty.

2. Install dependencies:
   ```
   npm install --prefix server
   npm install --prefix client
   ```

3. Run dev servers (two terminals):
   - Backend:
     ```
     npm run dev --prefix server
     ```
   - Frontend:
     ```
     npm run dev --prefix client
     ```
   - Frontend runs at http://localhost:5173. Backend runs at http://localhost:5001.
   - The Vite dev proxy maps `http://localhost:5173/api/*` → `http://localhost:5001/*`.

4. Initial admin user:
   - On first boot, the server seeds an Admin:
     - Email: `admin@example.com`
     - Password: `Admin@12345`
   - Login and change the password when prompted.

## Production Deployment
### Backend (Render)
- Environment Variables:
  - `CLIENT_URL` = `https://your-frontend.vercel.app`
  - `MONGO_URI` = your Atlas URI
  - `JWT_SECRET` = strong random secret
  - `NODE_ENV` = `production`
  - `PORT` = provided by Render (server uses `process.env.PORT || 5000`)
  - Optional email vars:
    - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- Start command:
  ```
  npm start
  ```
- Notes:
  - Atlas SRV DNS works on Render by default, so connections should succeed.

### Frontend (Vercel)
- Environment Variables:
  - `VITE_API_URL` = `https://your-backend.onrender.com`
- Build:
  ```
  npm run build
  ```

## Project Structure
```
server/
  config/       # DB connection helper
  controllers/  # Route handlers (auth, tickets, sales, etc.)
  middleware/   # Auth middleware
  models/       # Mongoose models
  routes/       # Express routers
  utils/        # Utilities (email)
  server.js     # App entrypoint
  .env.example  # Reference env keys

client/
  src/
    api/             # Axios config
    context/         # AuthContext
    pages/           # App pages
    components/      # UI components
    styles/          # Global styles
  vite.config.js     # Vite dev proxy configuration
  .env.example       # Reference env keys
```

## Common Issues
- 401 Unauthorized during dev:
  - Ensure frontend calls `/api/*` (proxy), not `http://localhost:5001`.
  - Cookies require `withCredentials: true` and proper CORS `CLIENT_URL`.
  - If backend fell back to memory DB, users reset on restart; use the seeded admin.
- DNS SRV failure locally:
  - Windows may block SRV DNS for Atlas. The server logs will fall back to memory DB for development. Deploy to Render to use Atlas reliably.

## Scripts
Backend:
- `npm run dev` – Nodemon dev server
- `npm start` – Production start (node server.js)

Frontend:
- `npm run dev` – Vite dev server
- `npm run build` – Production build

## Security
- Never commit `.env` files or secrets; they’re ignored by `.gitignore`.
- JWT is stored in an HTTP-only cookie so it isn’t accessible to JS and resists XSS token theft.


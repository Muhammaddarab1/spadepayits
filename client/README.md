# Ticket Management System – Frontend (Client)

## Overview
React + Vite + Tailwind CSS frontend for the internal Ticket Management System. Implements auth pages, dashboard, ticket list, create ticket modal, filtering, and password reset flow.

## Environment
Copy `.env.example` to `.env` and set:
- `VITE_API_URL` – URL of the backend (e.g., Render/Railway service URL)

## Scripts
- `npm run dev` – Start dev server
- `npm run build` – Build for production
- `npm run preview` – Preview production build locally

## Deployment
Deploy on Vercel:
1. Import repository.
2. Framework preset: `Vite`.
3. Environment variables: add `VITE_API_URL` pointing to your backend URL.
4. Build command: `npm run build`, Output directory: `dist`.

## Notes
- JWT stored in `localStorage` for simplicity; consider HTTP-only cookies for higher security in public deployments.
- API base URL is environment-based; no hardcoded URLs.

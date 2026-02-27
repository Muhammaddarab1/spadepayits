Local setup
1) Create server/.env using server/.env.example
2) Create client/.env using client/.env.example
3) From server: npm install; node server.js
4) From client: npm install; npm run dev

GitHub
1) git init
2) git add .
3) git commit -m "Initial commit"
4) create an empty GitHub repo
5) git remote add origin <repo_url>
6) git branch -M main
7) git push -u origin main

Render backend
1) Create web service from repo root; set root dir to server
2) Build command: npm install
3) Start command: node server.js
4) Environment variables:
   PORT (auto), MONGO_URI, JWT_SECRET, CLIENT_URL, CORS_ORIGINS, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

Vercel frontend
1) Import project; set root dir to client
2) Framework: Vite
3) Build command: npm run build
4) Output directory: dist
5) Environment variables:
   VITE_API_URL=https://<render-domain>

Production notes
1) Update CLIENT_URL and CORS_ORIGINS to your Vercel domain
2) First admin password appears in Render logs; change it on first login

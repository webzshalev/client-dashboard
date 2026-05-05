# ARCHITECTURE.md — Infrastructure & DevOps

> This document describes the next phase of development: migrating from localStorage to a database,
> adding a backend, containerization, automated testing, and CI/CD.
> Claude Code: read this file after CLAUDE.md and before doing any infrastructure work.

---

## Current State (before changes)

```
client-dashboard/
├── src/              ← Vue 3 frontend
├── CLAUDE.md
├── SKILL.md
└── .env              ← contains PUBLIC_API_PASSWORD (problem — needs to move to backend)
```

**Problems being solved:**
- Budget data stored in localStorage — wiped on browser clear, not shared across devices
- `PUBLIC_API_PASSWORD` is exposed in the frontend build
- No automated tests
- No structured deploy process to DirectAdmin

---

## New Project Structure

```
client-dashboard/
├── frontend/                    ← Vue 3 (existing code moves here)
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf               ← serve static files
│   └── package.json
│
├── backend/                     ← New Node.js service
│   ├── src/
│   │   ├── index.js             ← Express server, port 3001
│   │   ├── routes/
│   │   │   ├── budget.js        ← GET/POST /api/budget/:clientId
│   │   │   ├── links.js         ← POST /api/links, GET /api/links/:token
│   │   │   └── proxy.js         ← GET /api/monitor/* → Monitor API
│   │   └── db/
│   │       ├── client.js        ← SQLite connection (better-sqlite3)
│   │       └── migrations.js    ← create tables on startup
│   ├── tests/
│   │   └── budget.test.js
│   ├── Dockerfile
│   └── package.json
│
├── nginx/
│   └── nginx.conf               ← reverse proxy for frontend + backend
│
├── data/                        ← gitignored, persisted as Docker volume
│   └── dashboard.db             ← SQLite file
│
├── .github/
│   └── workflows/
│       ├── test.yml             ← CI on pull request
│       └── deploy.yml           ← CD on push to main
│
├── docker-compose.yml           ← local development
├── docker-compose.prod.yml      ← production
├── .env.example
└── Makefile                     ← convenience commands
```

---

## Database — SQLite

**Package:** `better-sqlite3` (synchronous, fast, no async/await needed)

### Tables

```sql
-- Budget per client / project / platform
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  project_name TEXT DEFAULT '_global',
  platform TEXT DEFAULT '_all',
  monthly_budget DECIMAL(10,2) DEFAULT 0,
  actual_spend DECIMAL(10,2) DEFAULT 0,
  leads_override INTEGER DEFAULT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, project_name, platform, month, year)
);

-- Encrypted dashboard share links
CREATE TABLE IF NOT EXISTS dashboard_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  client_id INTEGER NOT NULL,
  label TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Backend Routes

### Budget API

```
GET  /api/budget/:clientId
     query: ?month=5&year=2026&project=ProjectName
     → returns all records for this client / month

POST /api/budget/:clientId
     body: { project_name, platform, monthly_budget, actual_spend, leads_override, month, year }
     → INSERT OR REPLACE
     → returns the updated record
```

### Links API

```
POST /api/links
     body: { client_id, label }
     → creates encrypted token, saves to DB
     → returns { token, url }

GET  /api/links/:token
     → returns { client_id, label, is_active }
     → 404 if not found or not active
```

### Monitor Proxy

```
GET /api/monitor/client/:id/leads     → proxies to → Monitor /api/public/client/:id/leads
GET /api/monitor/client/:id/sources   → proxies to → Monitor /api/public/client/:id/sources
GET /api/monitor/client/:id/projects  → proxies to → Monitor /api/public/client/:id/projects
```

The backend adds the `Authorization: Bearer` header — the frontend never sees the secret.

---

## Frontend — Required Changes

### lib/api.js — before and after

```js
// Before (current)
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/public`,
  headers: { Authorization: `Bearer ${import.meta.env.VITE_PUBLIC_API_PASSWORD}` }
})

// After (new)
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/monitor`
  // No Authorization header — backend handles it
})

export const budgetApi = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/budget`
})
```

### useAdmin.js — budget storage

```js
// Before
localStorage.setItem(`wbz_${clientId}_${project}_budget`, JSON.stringify(data))

// After
await budgetApi.post(`/${clientId}`, { project_name, platform, ...data })
```

### Environment variables — before and after

```env
# Before
VITE_API_URL=https://api.truecontrol.co.il
VITE_PUBLIC_API_PASSWORD=secret123   ← removed from frontend!

# After
VITE_BACKEND_URL=http://localhost:3001
VITE_ADMIN_PIN=1234
VITE_LINK_SECRET=your-secret
```

---

## Docker

### frontend/Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### backend/Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001
CMD ["node", "src/index.js"]
```

### docker-compose.yml (local dev)
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      target: build
    command: npm run dev -- --host
    ports: ["5177:5177"]
    volumes: ["./frontend:/app", "/app/node_modules"]
    env_file: .env

  backend:
    build: ./backend
    command: node --watch src/index.js
    ports: ["3001:3001"]
    volumes: ["./backend:/app", "/app/node_modules", "./data:/data"]
    env_file: .env

  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes: ["./nginx/nginx.conf:/etc/nginx/nginx.conf"]
    depends_on: [frontend, backend]
```

### docker-compose.prod.yml
```yaml
version: '3.8'
services:
  frontend:
    image: ghcr.io/${GITHUB_REPO}/frontend:${VERSION}
    restart: always

  backend:
    image: ghcr.io/${GITHUB_REPO}/backend:${VERSION}
    restart: always
    volumes: ["./data:/data"]
    env_file: .env.production

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - "./nginx/nginx.conf:/etc/nginx/nginx.conf"
      - "./nginx/ssl:/etc/nginx/ssl"
    restart: always
```

---

## nginx/nginx.conf

```nginx
server {
  listen 80;
  server_name dashboard.webzapp.click;

  # Frontend static files
  location / {
    proxy_pass http://frontend:80;
  }

  # Backend API
  location /api/ {
    proxy_pass http://backend:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## CI/CD — GitHub Actions

### .github/workflows/test.yml
```yaml
name: Test
on: [pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run test        # Vitest
      - run: cd frontend && npm run build

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend && npm ci
      - run: cd backend && npm test             # Jest

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker-compose up -d
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - run: docker-compose down
```

### .github/workflows/deploy.yml
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        run: echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

      - name: Build and push images
        run: |
          docker build -t ghcr.io/${{ github.repository }}/frontend:${{ github.sha }} ./frontend
          docker build -t ghcr.io/${{ github.repository }}/backend:${{ github.sha }} ./backend
          docker push ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/backend:${{ github.sha }}

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/client-dashboard
            VERSION=${{ github.sha }} docker-compose -f docker-compose.prod.yml pull
            VERSION=${{ github.sha }} docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml ps
```

---

## Tests

### Frontend — Vitest
```
frontend/src/tests/
├── useClientData.test.js    ← data fetching + CPL calculation
├── useDateRange.test.js     ← URL sync
└── useAdmin.test.js         ← PIN validation + session handling
```

### Backend — Jest
```
backend/tests/
├── budget.test.js    ← GET/POST budget routes
└── links.test.js     ← token creation + lookup
```

### E2E — Playwright
```
e2e/
├── dashboard.spec.js    ← dashboard loads with data
├── admin.spec.js        ← correct/wrong PIN, budget save
└── links.spec.js        ← link creation, routing to dashboard
```

---

## Makefile

```makefile
dev:
	docker-compose up

build:
	docker-compose build

test:
	cd frontend && npm run test
	cd backend && npm test

e2e:
	npx playwright test

deploy:
	git push origin main

db-shell:
	sqlite3 data/dashboard.db

logs:
	docker-compose logs -f backend
```

---

## Recommended Build Order for Claude Code

1. Create `backend/` with Express + SQLite + all routes
2. Verify API works: `curl localhost:3001/api/budget/42`
3. Update `frontend/lib/api.js` to point to backend
4. Migrate localStorage budget calls in `useAdmin.js` to backend API
5. Create `frontend/Dockerfile` + `backend/Dockerfile`
6. Create `docker-compose.yml` and verify `make dev` works end-to-end
7. Add Vitest to frontend + Jest to backend
8. Create GitHub Actions workflows
9. Verify E2E with Playwright
10. Create `docker-compose.prod.yml` + `nginx/nginx.conf`

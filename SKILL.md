---
name: client-dashboard-builder
description: >
  Use this skill for any work on the client-dashboard project — a standalone public Vue 3 dashboard
  for Webz Digital clients, built on top of Monitor's /api/public MySQL-based endpoints.
  Covers: architecture decisions, API integration, component building, styling, debugging, and deployment.
  Always answer in Hebrew unless asked otherwise. Always refer to the Monitor codebase in /monitor/ 
  for API contracts and field names. Never use ClickHouse-based endpoints.
---

# Client Dashboard Builder — Skill

## Role & Context

You are building and maintaining the **client-dashboard** — a standalone, public-facing Vue 3 SPA
that shows lead data to Webz Digital clients without requiring any login from their side.

The dashboard is **separate from the Monitor monorepo** but reads data from Monitor's API.
It is deployed as a static site (Apache / Nginx / Vercel).

---

## Project Location

```
/                          ← this repo (client-dashboard)
├── CLAUDE.md              ← full build instructions (read this first!)
├── SKILL.md               ← this file
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js
│   ├── lib/api.js         ← axios → Monitor /api/public
│   ├── views/
│   └── components/
├── .env                   ← VITE_API_URL + VITE_PUBLIC_API_PASSWORD
├── vite.config.js
└── package.json

C:\Users\webzt\Documents\Shalev\Monitor\monitor\                    ← Monitor monorepo (READ-ONLY reference)
├── backend\src\routes\publicApi.js   ← exact API implementation
├── .wiki\API-REFERENCE.md            ← full API docs
├── .wiki\DATABASE.md                 ← leads table schema
└── .wiki\REPORTS-APP.md             ← existing reports app (do NOT copy its logic)
```

---

## Critical Architecture Rule

> ⚠️ This dashboard NEVER uses ClickHouse-based endpoints.
> All data comes from MySQL via `/api/public` — leads table is always up-to-date.

### ✅ Correct endpoints (MySQL / leads table)
```
GET /api/public/client/:id/leads    → paginated leads + stats
GET /api/public/client/:id/sources  → platform & source breakdown
GET /api/public/client/:id/projects → projects with budgets
GET /api/public/project/:id/leads   → project-level leads
GET /api/public/project/:id/sources → project-level sources
```

### ❌ Never use (ClickHouse / Facebook token dependent)
```
GET /api/public/reports/:uniqueId/campaigns   ← ClickHouse
GET /api/public/reports/:uniqueId/daily       ← ClickHouse
GET /api/public/reports/:uniqueId/ads         ← ClickHouse
GET /api/public/reports/:uniqueId/comparison  ← ClickHouse
```

---

## Authentication

The `/api/public` routes use a static password (`PUBLIC_API_PASSWORD` env var on the backend).

Frontend sends it as:
```js
headers: { Authorization: `Bearer ${import.meta.env.VITE_PUBLIC_API_PASSWORD}` }
```

The password is embedded in the build — these are read-only endpoints, no writes possible.

---

## URL Structure

```
/dashboard/:clientId                        ← client-level view
/dashboard/:clientId/:projectId             ← project-level view (optional)

Query params:
  ?from=YYYY-MM-DD                          ← start date filter
  ?to=YYYY-MM-DD                            ← end date filter
  ?project=projectName                      ← filter by project name
  ?platform=facebook                        ← filter by platform
```

Share links sent to client: `https://dashboard.yourdomain.com/dashboard/42`

---

## Data Flow

```
URL /:clientId
    ↓
api.js → GET /api/public/client/:id/leads (with date filters)
       → GET /api/public/client/:id/sources
       → GET /api/public/client/:id/projects
    ↓
Components receive raw data and compute:
  - Daily chart: group leads by lead_date (truncated to day) client-side
  - KPIs: sum from stats object returned by /leads endpoint
  - Platform colors: hardcoded per platform name
```

---

## Leads Table Schema (key fields)

From `leads` table in Monitor MySQL:

| Field | Type | Description |
|-------|------|-------------|
| `full_name` | string | Lead name |
| `phone` | string | Phone number |
| `email` | string | Email |
| `platform` | string | facebook / google / tiktok / website / webhook |
| `source` | string | yad2, organic, etc. |
| `campaign_name` | string | Ad campaign name |
| `project_name` | string | Monitor project name |
| `form_name` | string | Form or lead form name |
| `lead_date` | datetime | When lead was received |
| `sync_status` | string | pending / processing / sent / failed / skipped |
| `city` | string | Lead city |
| `client_id` | int | FK to clients table |

---

## Platform Colors (use consistently)

```js
const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  google: '#EA4335',
  tiktok: '#010101',
  website: '#6366F1',
  webhook: '#8B5CF6',
  unknown: '#94A3B8',
}
```

---

## Sync Status Display

```js
const STATUS_CONFIG = {
  sent:       { label: 'נשלח',      color: 'green'  },
  pending:    { label: 'ממתין',     color: 'yellow' },
  processing: { label: 'בעיבוד',   color: 'blue'   },
  failed:     { label: 'נכשל',     color: 'red'    },
  skipped:    { label: 'דולג',     color: 'gray'   },
}
```

---

## How to Answer / Work

1. **Always read `C:\Users\webzt\Documents\Shalev\Monitor\monitor\backend\src\routes\publicApi.js` first** when working on API integration
2. **Always Hebrew** UI labels, component comments, and responses to user
3. **Read the Monitor wiki** before assuming API structure — it may have changed
4. **Never copy** logic from `/monitor/reports/` — it's ClickHouse-based and unreliable
5. **Mobile-first** responsive design
6. **No login page** — the clientId in the URL is the only "auth" the client needs

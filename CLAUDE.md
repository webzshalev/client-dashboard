# CLAUDE.md — Client Dashboard Build Instructions

> This file is read automatically by Claude Code on every session.
> It contains the full spec for building the client-dashboard project.

---

## What Is This Project?

A **standalone public Vue 3 SPA** that shows lead data to Webz Digital clients.

- **No client login required** — URL contains clientId as the only "key"
- **100% MySQL-based** — uses Monitor's `/api/public` endpoints (leads table)
- **Independent repo** — not part of the Monitor monorepo
- **Deployed as static site** — Apache / Nginx / Vercel

### Why NOT use the existing reports app?
The existing `data.webzapp.click` dashboard reads from **ClickHouse** (Facebook tokens, Google API).
When tokens expire or sync fails → data disappears. This dashboard reads from MySQL `leads` table
which is **always live** and doesn't depend on any external token.

---

## Monitor Codebase Reference

The Monitor monorepo is located at:
```
C:\Users\webzt\Documents\Shalev\Monitor\monitor\
```

Before writing any API call, read the actual source files:

```
C:\Users\webzt\Documents\Shalev\Monitor\monitor\backend\src\routes\publicApi.js
C:\Users\webzt\Documents\Shalev\Monitor\monitor\.wiki\API-REFERENCE.md
C:\Users\webzt\Documents\Shalev\Monitor\monitor\.wiki\DATABASE.md
C:\Users\webzt\Documents\Shalev\Monitor\monitor\.wiki\ARCHITECTURE.md
```

> **Rule**: Always check the actual source before assuming API shape.

---

## Environment Variables

```env
# .env (development)
VITE_API_URL=https://api.truecontrol.co.il
VITE_PUBLIC_API_PASSWORD=<ask team for this — it's PUBLIC_API_PASSWORD from Monitor backend .env>
VITE_APP_TITLE=דאשבורד לקוח

# .env.production
VITE_API_URL=https://api.truecontrol.co.il
VITE_PUBLIC_API_PASSWORD=<same password>
```

---

## Project Structure to Build

```
client-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js          ← Tailwind v4 config
├── .env                        ← gitignored
├── .env.example                ← committed, values redacted
├── CLAUDE.md                   ← this file
├── SKILL.md                    ← skill instructions
├── README.md
└── src/
    ├── main.js                 ← Vue app entry
    ├── App.vue                 ← root, sets dir="rtl"
    ├── style.css               ← global styles + Heebo font
    ├── router/
    │   └── index.js            ← routes: /dashboard/:clientId
    ├── lib/
    │   └── api.js              ← axios instance → Monitor /api/public
    ├── composables/
    │   ├── useClientData.js    ← fetches + caches all data for a client
    │   └── useDateRange.js     ← date range state + URL sync
    ├── views/
    │   ├── DashboardView.vue   ← main view: assembles all sections
    │   └── NotFoundView.vue    ← 404 / inactive link
    └── components/
        ├── layout/
        │   ├── AppHeader.vue       ← client name + date range picker + export
        │   └── LoadingSkeleton.vue ← shown while fetching
        ├── kpi/
        │   └── KpiCards.vue        ← 4-6 KPI stat cards (top row)
        ├── charts/
        │   └── DailyLeadsChart.vue ← line/bar chart, built client-side from leads
        ├── tables/
        │   ├── LeadsTable.vue      ← paginated leads list
        │   ├── PlatformTable.vue   ← platform breakdown
        │   └── SourceTable.vue     ← source breakdown
        └── projects/
            └── ProjectsGrid.vue    ← project cards with budget bars
```

---

## API Integration

### lib/api.js

```js
import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/public`,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_PUBLIC_API_PASSWORD}`,
  },
})

export default api
```

### Endpoints Used

#### 1. Client Leads (main data source)
```
GET /client/:clientId/leads
```
Query params:
- `start_date` — YYYY-MM-DD
- `end_date` — YYYY-MM-DD
- `platform` — filter by platform
- `source` — filter by source
- `project_name` — filter by project
- `sync_status` — filter by status
- `search` — search in name/phone
- `page` — pagination page (default 1)
- `per_page` — page size (max 200)
- `sort_by` — field to sort (default: lead_date)
- `sort_dir` — ASC / DESC

Response shape:
```json
{
  "success": true,
  "client": { "id": 42, "name": "Client Name" },
  "pagination": { "page": 1, "per_page": 50, "total": 1250, "total_pages": 25 },
  "stats": {
    "total": 1250,
    "by_status": { "sent": 900, "pending": 200, "failed": 150 },
    "by_platform": { "facebook": 800, "google": 300, "website": 150 },
    "by_source": { "yad2": 200, "organic": 150 },
    "by_project": { "Project A": 700, "Project B": 550 }
  },
  "data": [
    {
      "id": 1,
      "full_name": "ישראל ישראלי",
      "phone": "0501234567",
      "email": "israel@example.com",
      "platform": "facebook",
      "source": "yad2",
      "campaign_name": "Campaign Name",
      "project_name": "Project A",
      "form_name": "Form Name",
      "lead_date": "2026-04-15 10:30:00",
      "sync_status": "sent",
      "city": "תל אביב"
    }
  ]
}
```

#### 2. Client Sources (platform/source breakdown)
```
GET /client/:clientId/sources
```
Query params: `start_date`, `end_date`, `project_name`

Response:
```json
{
  "success": true,
  "platforms": [
    { "name": "facebook", "lead_count": 800, "first_lead": "...", "last_lead": "..." }
  ],
  "sources": [
    { "name": "yad2", "platform": "facebook", "lead_count": 200, "first_lead": "...", "last_lead": "..." }
  ]
}
```

#### 3. Client Projects (with budgets)
```
GET /client/:clientId/projects
```
Query params: `month` (1-12), `year`

Response:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "project_name": "Project A",
        "platforms": [
          { "name": "פייסבוק", "monthly_budget": 5000, "updated_budget": 5500, "budget_usage": 3200 }
        ],
        "total_budget": { "monthly_budget": 8000, "updated_budget": 8500, "budget_usage": 5000, "usage_percent": 58.82 }
      }
    ]
  }
}
```

#### 4. Project-level Leads & Sources
```
GET /project/:projectId/leads    ← same shape as client leads
GET /project/:projectId/sources  ← same shape as client sources
```

---

## Data Processing (client-side)

### Daily Chart Data
The API does NOT return daily aggregated data from MySQL.
Build it client-side from the leads array:

```js
function buildDailyChart(leads) {
  const daily = {}
  for (const lead of leads) {
    const day = lead.lead_date.substring(0, 10) // "2026-04-15"
    daily[day] = (daily[day] || 0) + 1
  }
  // Sort by date and return as array
  return Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}
```

To get all leads for charting (not paginated):
```
GET /client/:id/leads?per_page=1000&page=1&sort_by=lead_date&sort_dir=ASC
```
Repeat for page 2, 3 if `total_pages > 1`. Cache result.

### KPI Calculations
All from `stats` object in /leads response:
```js
const kpis = {
  totalLeads: stats.total,
  byPlatform: stats.by_platform,       // { facebook: 800, google: 300 }
  byStatus: stats.by_status,           // { sent: 900, failed: 150 }
  topPlatform: Object.entries(stats.by_platform).sort((a,b) => b[1]-a[1])[0]?.[0],
}
```

---

## Components Spec

### KpiCards.vue
Display as a responsive grid (2 cols mobile, 4 cols desktop):

| Card | Value | Icon |
|------|-------|------|
| סה"כ לידים | stats.total | 👥 |
| פלטפורמה מובילה | top platform name + count | 📊 |
| נשלחו ל-CRM | stats.by_status.sent | ✅ |
| נכשלו | stats.by_status.failed | ❌ |

### DailyLeadsChart.vue
- Use Chart.js (`npm i chart.js`)
- Line chart showing leads per day
- X axis: dates, Y axis: lead count
- Color: `#6366F1` (indigo)
- Show tooltip with exact count + date in Hebrew format
- If < 3 days of data → show bar chart instead

### LeadsTable.vue
Columns (Hebrew headers):
```
# | שם מלא | טלפון | פלטפורמה | מקור | קמפיין | פרויקט | תאריך | סטטוס
```
- Phone: show as clickable `tel:` link
- Platform: colored badge
- Status: colored pill badge
- Pagination: show page controls if total_pages > 1
- Search input: debounced 400ms → updates URL param → re-fetch

### PlatformTable.vue
```
פלטפורמה | לידים | אחוז | ראשון | אחרון
```
- Platform icon/color dot
- Percentage bar (mini progress bar inline)
- Sort by lead_count desc

### ProjectsGrid.vue
Card per project:
- Project name (bold)
- Platform tags
- Budget usage bar: `budget_usage / updated_budget * 100`
- Numbers: ₪X,XXX format
- Color: green if usage < 70%, yellow 70-90%, red > 90%

---

## Design System

### Colors
```css
--primary: #6366F1;      /* indigo — main brand */
--success: #10B981;      /* green — sent status */
--warning: #F59E0B;      /* yellow — pending */
--danger: #EF4444;       /* red — failed */
--muted: #94A3B8;        /* gray — skipped */
--bg: #F8FAFC;           /* page background */
--card: #FFFFFF;         /* card background */
--border: #E2E8F0;       /* borders */
--text: #1E293B;         /* primary text */
--text-muted: #64748B;   /* secondary text */
```

### Platform Colors
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

### Typography
```css
font-family: 'Heebo', sans-serif;  /* Google Fonts */
direction: rtl;
text-align: right;
```

### Cards
```css
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
padding: 20px 24px;
```

---

## Date Range Picker

### Preset Buttons (Hebrew)
```
היום | שבוע אחרון | חודש אחרון | 3 חודשים | השנה
```

### URL Sync
Date range is stored in URL query params:
```
/dashboard/42?from=2026-01-01&to=2026-04-30
```
On load: read from URL → set as default. On change: update URL + re-fetch.

### Default Range
If no URL params → default to **last 30 days**.

---

## Loading & Error States

### Loading Skeleton
While fetching, show grey animated skeleton cards:
- 4 KPI card skeletons (same grid layout)
- Chart skeleton (full width bar)
- Table skeleton (5 rows)

### Error State
If API returns error or clientId not found:
```
[sad face icon]
לא ניתן לטעון את הנתונים
נסה לרענן את הדף או פנה ל-Webz Digital
```

### Empty State
If no leads in date range:
```
[chart icon]
אין לידים בטווח התאריכים הנבחר
נסה לבחור טווח תאריכים רחב יותר
```

---

## Build & Run

```bash
npm install
npm run dev      # http://localhost:5177

npm run build    # dist/ folder
npm run preview  # preview production build
```

### vite.config.js
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5177,
  }
})
```

---

## Deployment

Deploy `dist/` as a static site. Apache config example:

```apache
<VirtualHost *:443>
  ServerName dashboard.webzapp.click
  DocumentRoot /var/www/client-dashboard/dist

  <Directory /var/www/client-dashboard/dist>
    Options -Indexes
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>
```

`.htaccess` for Vue Router history mode:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## First Build Steps (for Claude Code)

1. Read `C:\Users\webzt\Documents\Shalev\Monitor\monitor\backend\src\routes\publicApi.js` — understand exact API shape
2. Read `C:\Users\webzt\Documents\Shalev\Monitor\monitor\.wiki\DATABASE.md` — understand leads table fields
3. Scaffold the Vue 3 project with `npm create vite@latest . -- --template vue`
4. Install: `npm i axios chart.js`
5. Build in this order:
   - `lib/api.js`
   - `router/index.js`
   - `composables/useClientData.js`
   - `composables/useDateRange.js`
   - `views/DashboardView.vue` (shell only first)
   - Components one by one, starting with KpiCards
6. Test against real API before building charts
7. Build DailyLeadsChart last (needs working data first)

---

## Notes

- The `PUBLIC_API_PASSWORD` is **not a secret** in the traditional sense — it's embedded in the client-facing build. The API is read-only, scoped by clientId, and shows only what the client already knows.
- If you need project-level isolation, use `/project/:id/leads` instead of `/client/:id/leads?project_name=X` — both work but the project endpoint is cleaner.
- For large clients with 5000+ leads, the daily chart should paginate in background and update progressively.

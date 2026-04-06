# Architecture

## Overview

Two distinct surfaces sharing one codebase and one database:

```
Public surface   → portfolio, blog, contact     (no auth required)
Private surface  → admin panel, AI feeds, tools (session required)
```

Both are served by a single Next.js 14 App Router application. There is no separate admin app, no separate API service, and no microservices. This is intentional — solo maintainability is a first-class requirement.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/ISR for SEO, RSC for performance, API routes for backend — one repo |
| Language | TypeScript (strict) | Type safety across the full stack |
| Styling | Tailwind CSS v3 + globals.css | Utility-first, co-located styles, custom design tokens in config |
| Database | PostgreSQL 16 | Relational, reliable, good full-text search, Prisma support |
| ORM | Prisma | Type-safe queries, migrations, schema as source of truth |
| Auth | Auth.js v5 (credentials) | Simple single-user admin auth, session-based |
| Email | Resend | Reliable transactional email, generous free tier |
| File storage | Cloudflare R2 (or local `/public/uploads`) | S3-compatible, no egress fees |
| AI agents | TypeScript scripts + cron | Simple, debuggable, no queue framework needed for low-frequency jobs |
| LLM | Anthropic Claude API | For agent summarization |
| Reverse proxy | Nginx | HTTPS termination, security headers, n8n proxying |
| Containerisation | Docker Compose | Reproducible deployment on any VPS |

---

## Application Layers

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App (single process)                           │
│                                                         │
│  Public routes    /           → RSC, SEO-optimised      │
│                   /blog/*     → SSG/ISR                 │
│                   /projects/* → SSG/ISR                 │
│                                                         │
│  Admin routes     /admin/*    → SSR, auth-gated         │
│                                                         │
│  API routes       /api/contact        → public, rate-limited │
│                   /api/admin/*        → auth-required   │
│                   /api/auth/*         → Auth.js handlers │
│                                                         │
│  Middleware       src/middleware.ts   → session check   │
└───────────────────────────┬─────────────────────────────┘
                            │
                     ┌──────▼──────┐
                     │  PostgreSQL  │
                     │  (Prisma)   │
                     └─────────────┘

Agent scripts run as separate Node.js processes (cron-triggered),
write results to PostgreSQL, displayed in admin panel.
```

---

## Request Flow

### Public page request
```
Browser → Nginx (HTTPS) → Next.js → RSC renders page
                                   → Prisma queries DB (or falls back to mock-data.ts)
                                   → HTML streamed to browser
```

### Admin request
```
Browser → Nginx → Next.js middleware
                    → no session cookie → redirect /admin/login
                    → valid session     → render admin page → Prisma → DB
```

### Contact form submission
```
Browser → POST /api/contact
         → rate limit check (in-memory or Upstash)
         → input validation
         → Resend API → email delivered
         → 200 OK
```

### AI agent execution
```
cron → npx tsx agents/github-summarizer.ts
         → GitHub API (public)
         → Anthropic API (summarize)
         → prisma.agentReport.create()
         → Admin panel reads reports on next visit
```

---

## Deployment Architecture

```
Internet
    │
    ▼
Nginx (port 80/443)
    │  TLS termination
    │  Security headers
    │  Rate limiting (optional, via nginx limit_req)
    │
    ├──► Next.js app (port 3000, Docker)
    │      └── PostgreSQL (port 5432, Docker, internal only)
    │
    └──► n8n (port 5678) — ONLY via IP allowlist or VPN
         Never exposed publicly without auth gate
```

**Recommended hosting:** Hetzner CX22 (€4/mo, 2vCPU, 4GB RAM, 40GB SSD)
This comfortably runs Next.js + PostgreSQL + n8n on a single machine.

---

## Mock Mode vs Live Mode

The site has two content modes:

| Mode | Triggered by | Content source |
|---|---|---|
| Mock / Preview | `DATABASE_URL` not set | `src/lib/mock-data.ts` |
| Live | `DATABASE_URL` set | PostgreSQL via Prisma |

Mock mode is the default for local development with zero setup.
Components should check for DB availability gracefully — never crash if DB is absent.

Pattern for future components:
```typescript
// Preferred pattern for data fetching in RSC
async function getData() {
  if (!process.env.DATABASE_URL) {
    return MOCK_DATA; // from mock-data.ts
  }
  return prisma.project.findMany({ ... });
}
```

---

## Self-Hosted Tool Integration

Self-hosted tools (n8n, Grafana, etc.) are **never embedded directly** in the public domain.

Recommended approach (in order of security):
1. **VPN-only (Tailscale)** — tools only accessible on VPN. Admin panel shows a link + VPN reminder. Best for sensitive tools.
2. **IP allowlist via Nginx** — tools subdomain restricted to known IPs. Good for home static IP.
3. **forward_auth via Nginx** — Nginx validates your Next.js session before proxying. More complex but accessible from any network.

See `nginx/portfolio.conf` for the commented proxy template.

---

## Performance Targets

| Metric | Target | How |
|---|---|---|
| Lighthouse Performance | > 90 | RSC, `next/image`, `next/font`, no layout shift |
| Lighthouse SEO | 100 | Meta tags, sitemap, JSON-LD, canonical URLs |
| Lighthouse Accessibility | > 95 | Semantic HTML, ARIA, contrast ratios |
| TTFB | < 200ms | Server components, no client waterfalls |
| LCP | < 2.5s | Image optimisation, font preloading |

---

## Key Architectural Decisions

**Why not Astro?**
Astro is excellent for static sites but doesn't fit here. We need a custom admin panel, server-side auth, AI agent result storage, and API routes — all in one codebase. Next.js handles all of this natively.

**Why not a headless CMS (Sanity, Contentful)?**
CMS products add cost, external dependency, and don't integrate naturally with the AI agent layer or the custom admin requirements. Owning the admin panel means full control.

**Why not microservices?**
Solo builder. One repo, one deployment, one mental model. The complexity budget is reserved for actual features, not infrastructure orchestration.

**Why PostgreSQL over SQLite?**
Full-text search support, better concurrency, production-ready from day one. SQLite would need migrating later; PostgreSQL scales without changes.

**Why Auth.js credentials over OAuth?**
Single user. No need for OAuth complexity. A username/password login with a strong secret is simpler and less attack surface.

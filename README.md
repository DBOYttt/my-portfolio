# Personal Portfolio Platform

A full-stack personal portfolio and admin platform built with Next.js 14, PostgreSQL, and Prisma.

## What this is

A two-layer platform:
- **Public portfolio** — professional presentation for employers: projects, skills, experience, robotics work, blog, contact
- **Private admin** — content management, blog editor, AI agent intelligence feeds, shortcuts to self-hosted tools (n8n, etc.)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js v5 |
| Email | Resend |
| AI Agents | Anthropic Claude API |
| Deployment | Docker Compose + Nginx |

## What You Need to Provide

Before the site is fully functional you must supply the following. The site runs in **mock mode** without a database (public pages work, admin does not).

### Required — admin panel + DB mode

| Item | Where to set it | Notes |
|---|---|---|
| PostgreSQL database | `DATABASE_URL` in `.env` | Must be a direct `postgres://` URL. See `.env.example`. |
| Auth secret | `AUTH_SECRET` in `.env` | Generate with `openssl rand -base64 32` |
| Admin email + password | `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` | Used by `npm run db:seed` to create your login |

### Required — contact form emails

| Item | Where to set it | Notes |
|---|---|---|
| Resend API key | `RESEND_API_KEY` in `.env` | Free tier: 3 000 emails/mo at resend.com |
| Your email address | `CONTACT_EMAIL` in `.env` | Where contact form submissions are delivered |

### Required — AI agents

| Item | Where to set it | Notes |
|---|---|---|
| Anthropic API key | `ANTHROPIC_API_KEY` in `.env` | Required for agent LLM summarization |
| GitHub username | `GITHUB_USERNAME` in `.env` | Used by the GitHub Summarizer agent |
| GitHub token | `GITHUB_TOKEN` in `.env` | Optional but avoids GitHub API rate limits |

### Content — your actual information

| Item | What to do |
|---|---|
| Personal info | Edit the `OWNER` object in `src/lib/mock-data.ts` — name, title, bio, social links |
| Photo | Place at `public/photo.jpg` — About section shows it automatically |
| CV / resume | Generated automatically by the CV Generator agent (Milestone 4.5) once skills, experience, and projects are in the DB. Can also be placed manually at `public/cv.pdf` as a temporary placeholder. |
| Projects, skills, experience | Use the admin panel at `/admin` once DB is running, or edit `src/lib/mock-data.ts` for mock mode |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/yourusername/my-portfolio.git
cd my-portfolio
npm install
```

### 2. Try mock mode first (no DB needed)

```bash
npm run dev
# → http://localhost:3000  — public portfolio with placeholder content
```

### 3. Set up the database

```bash
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

npm run db:push        # Apply schema
npm run db:seed        # Create admin user
npm run dev            # Now running against real DB
```

`DATABASE_URL` must be a direct `postgres://` connection string, e.g.:
```
DATABASE_URL="postgres://user:password@127.0.0.1:5432/portfolio"
```

### 4. Open the app

```
http://localhost:3000        — public portfolio
http://localhost:3000/admin  — admin panel (login with your seeded credentials)
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage (public portfolio)
│   ├── blog/                 # Blog listing and posts
│   ├── projects/             # Project case studies
│   ├── admin/                # Admin panel (auth-gated)
│   └── api/                  # API routes
├── components/
│   ├── public/               # Public-facing components
│   └── admin/                # Admin panel components
└── lib/
    └── prisma.ts             # Prisma client singleton
prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Admin user seeder
agents/                       # AI agent scripts (run via cron)
```

## Implementation Phases

- **Milestone 1** — Foundation: Next.js setup, DB, auth, core portfolio sections ✅
- **Milestone 2** — Full portfolio: projects, experience, contact form, SEO ✅
- **Milestone 3** — Admin + Blog: CRUD editor, markdown, media uploads ✅
- **Milestone 4** — AI Agents: wire LLM calls, agent run controls, `/projects` index ← current
- **Milestone 5** — Deployment: VPS, Docker Compose, Nginx HTTPS, PostgreSQL
- **Milestone 6** — Polish: Lighthouse 90+, analytics, dark/light mode, accessibility

## Security Notes

- Admin routes are protected by server-side session validation
- Self-hosted tools (n8n, etc.) should remain on a separate subdomain with IP allowlist or VPN-only access
- Never commit `.env` — use `.env.example` as the reference
- Rate limiting applied to contact form endpoint

## License

Private — not for redistribution.

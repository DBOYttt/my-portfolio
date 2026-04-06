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

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/yourusername/my-portfolio.git
cd my-portfolio
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Set up database

```bash
# Start PostgreSQL (or use your existing instance)
npm run db:push        # Apply schema to DB
npm run db:seed        # Create admin user
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the portfolio.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

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
- **Milestone 2** — Full portfolio: projects, experience, contact form, SEO, deploy
- **Milestone 3** — Admin + Blog: CRUD editor, markdown, media uploads
- **Milestone 4** — AI Agents: GitHub summarizer, news curator, agent dashboard
- **Milestone 5** — Polish: tools panel, analytics, performance, accessibility

## Security Notes

- Admin routes are protected by server-side session validation
- Self-hosted tools (n8n, etc.) should remain on a separate subdomain with IP allowlist or VPN-only access
- Never commit `.env` — use `.env.example` as the reference
- Rate limiting applied to contact form endpoint

## License

Private — not for redistribution.

# Development Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | Use nvm or fnm to manage versions |
| npm | 10+ | Comes with Node 20 |
| PostgreSQL | 16 | Only needed for non-mock mode |
| Git | any | Must be configured with name + email |

---

## First-Time Setup

```bash
# 1. Clone
git clone git@github.com:DBOYttt/my-portfolio.git
cd my-portfolio

# 2. Install dependencies
npm install

# 3. Start in mock mode (no DB needed)
npm run dev
# → http://localhost:3000

# 4. (Optional) Set up database for full mode
cp .env.example .env
# Edit .env: set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

npm run db:push    # Apply schema
npm run db:seed    # Create admin user
npm run dev        # Now runs against real DB
```

---

## Available Commands

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build (catches type errors)
npm run start        # Serve production build locally
npm run lint         # ESLint check

# Database
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Sync schema to DB without migration history (dev)
npm run db:migrate   # Create + apply migration (use for production changes)
npm run db:studio    # Open Prisma Studio GUI at localhost:5555
npm run db:seed      # Create admin user (uses ADMIN_EMAIL + ADMIN_PASSWORD from .env)

# AI Agents (run manually or via cron)
npx tsx agents/github-summarizer.ts
npx tsx agents/robotics-news.ts
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

```bash
cp .env.example .env
```

### Required for full mode (DB + auth)
```
DATABASE_URL        PostgreSQL connection string
AUTH_SECRET         Random secret — openssl rand -base64 32
ADMIN_EMAIL         Email for admin login
ADMIN_PASSWORD      Password for admin login (min 12 chars recommended)
```

### Required for contact form email
```
RESEND_API_KEY      Get from resend.com (free tier: 3000 emails/mo)
CONTACT_EMAIL       Where contact form emails are delivered
```

### Required for AI agents
```
ANTHROPIC_API_KEY   Get from console.anthropic.com
GITHUB_USERNAME     Your GitHub username
GITHUB_TOKEN        GitHub PAT with public_repo read scope (for higher rate limits)
```

### Optional
```
NEXT_PUBLIC_SITE_URL  Full URL of your site (used for OG images, sitemap)
R2_*                  Cloudflare R2 credentials (for media uploads in Phase 2+)
```

---

## Project Conventions

### File naming
- React components: `PascalCase.tsx`
- Utilities/lib: `kebab-case.ts`
- API routes: `route.ts` inside the route folder

### Component rules
- Server components by default — add `"use client"` only when you need browser APIs or event handlers
- Keep components focused: one section = one component
- No inline styles — use Tailwind classes or globals.css

### Adding a new public section
1. Create `src/components/public/YourSection.tsx`
2. Add any static/mock content to `src/lib/mock-data.ts`
3. Import and add to `src/app/page.tsx`
4. Add a nav anchor to `src/components/public/Nav.tsx` if needed

### Adding a new admin page
1. Create `src/app/admin/your-page/page.tsx`
2. The middleware in `src/middleware.ts` automatically protects all `/admin/*` routes
3. Add to the admin sidebar nav (once built in Milestone 3)

### Modifying the database schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate -- --name describe_the_change`
3. Run `npm run db:generate`
4. Commit both `prisma/schema.prisma` and the new migration file

### Adding a new API route
```
src/app/api/
  your-feature/
    route.ts   ← export GET, POST, etc.
```
- Public routes: add rate limiting if they accept user input
- Admin routes: validate session at the top of every handler

---

## Design System

All design tokens are in `tailwind.config.ts` and `src/app/globals.css`.

### Colours
```
Background page:    #0f1117  (bg-[#0f1117])
Background card:    #1a1d27  (bg-[#1a1d27])
Border:             #2a2d3a  (border-[#2a2d3a])
Text primary:       slate-100
Text body:          slate-400
Text muted:         slate-500, slate-600
Accent:             cyan-500 / #06b6d4
```

### Reusable CSS classes (globals.css)
```css
.section-container   /* max-w-6xl centered with padding */
.section-heading     /* h2 typography */
.accent-line         /* cyan decorative underline */
.card                /* elevated card surface */
.tag                 /* small tech/category label */
.btn-primary         /* cyan CTA button */
.btn-secondary       /* ghost/outline button */
```

### Typography
- Headings: Inter bold
- Body: Inter regular
- Code/labels/mono details: JetBrains Mono (loaded via next/font in Phase 2)

---

## Common Tasks

### Update your personal info
Edit `src/lib/mock-data.ts` — change `OWNER`, `SKILLS`, `EXPERIENCE`, `PROJECTS`, `ROBOTICS_HIGHLIGHTS`, `BLOG_POSTS`.

### Add a real project
In mock mode: add to `PROJECTS` array in `mock-data.ts`.
In DB mode (Milestone 3+): use the admin panel at `/admin/projects/new`.

### Add your CV
Place your PDF at `public/cv.pdf`. The nav and hero already link to `/cv.pdf`.

### Add your photo
Place your photo at `public/photo.jpg` (or any format).
Update `src/components/public/AboutSection.tsx` to use `<Image src="/photo.jpg" ... />`.

---

## Linting and Type Checking

```bash
npm run lint         # ESLint (configured via eslint-config-next)
npx tsc --noEmit     # TypeScript check without building
npm run build        # Full build — catches both lint and type errors
```

TypeScript strict mode is on. Fix all type errors before committing — do not suppress with `any` unless unavoidable and explained with a comment.

---

## Testing Strategy

No automated tests exist yet (appropriate for MVP phase). When adding tests:
- Unit tests: `vitest` (fast, TypeScript-native)
- Integration tests: real database, not mocks (lessons learned: mock/prod divergence causes silent failures)
- E2E tests: `playwright` for critical user flows (employer visits homepage, admin publishes post)

Add tests before Milestone 4 (AI agents), where correctness is harder to verify visually.

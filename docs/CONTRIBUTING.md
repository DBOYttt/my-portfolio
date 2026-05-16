# Contributing

## Development Setup

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/yourusername/my-portfolio.git
   cd my-portfolio
   npm install
   ```
2. Start in mock mode (no database needed):
   ```bash
   npm run dev
   # → http://localhost:3000
   ```
3. To enable the full admin panel, agents, and database: copy `.env.example` → `.env` and fill in `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, then run `npm run db:push && npm run db:seed`.

See `docs/DEVELOPMENT.md` for a full setup walkthrough.

---

## Code Standards

- **TypeScript strict mode** — no `any` casts, no suppressed type errors without explanation
- **No `console.log`** in production code paths
- **`"use client"`** only when the feature genuinely requires browser APIs or interactivity — default to Server Components
- **Content strings belong in `src/lib/mock-data.ts`**, not hardcoded in components
- **Admin panel** uses Tailwind explicit hex values; **public portfolio** uses CSS custom properties (`--paper`, `--ink`, `--accent`, etc.)
- Do not add progress bars or percentage meters to the Skills section — they are perceived as arbitrary
- Do not add particle effects, typing animations on the hero, or scroll-jacking

---

## Commit Convention

```
type(scope): short imperative description

Types:  feat | fix | refactor | style | docs | chore | test
Scope:  public | admin | blog | agents | db | auth | api | infra | docs

Examples:
  feat(public): add testimonials section
  fix(api): correct rate limit window calculation in contact route
  chore(db): add index on Post.publishedAt
```

---

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes
3. Run the full verification suite:
   ```bash
   npm test && npm run lint && npx tsc --noEmit
   ```
4. Verify mock mode still works with no `.env` file: `npm run dev`
5. Open a PR against `main` — the PR template will guide you

---

## What We Welcome

- **Bug fixes** — especially those affecting mock mode, Docker setup, or cross-platform compatibility
- **Documentation improvements** — clearer setup instructions, better inline comments
- **New public portfolio sections** — if the design fits the Engineering Logbook aesthetic
- **Admin panel improvements** — usability, new CRUD fields, editor polish
- **Agent improvements** — better output, new data sources, reliability fixes

---

## What We Don't Accept

- Personal data changes — these are owner-specific and managed via `/setup-portfolio` or `src/lib/mock-data.ts`
- Changes that break the zero-config mock mode experience (`npm run dev` with no `.env`)
- New required npm dependencies without prior discussion in an issue
- Features beyond what was requested — no scope creep in PRs

---

## Testing

The test suite uses Vitest:

```bash
npm test          # Run all tests (67+)
npm run test:watch  # Watch mode for TDD
```

- Add tests for new utility functions and API routes
- Follow existing patterns in `src/lib/__tests__/` and `src/app/api/__tests__/`
- Integration tests hit real patterns — avoid heavy mocking where the existing suite doesn't

---

## Architecture Notes

- **Mock mode** is active when `DATABASE_URL` is absent or starts with `prisma+postgres://`. The `isMock()` helper in `src/lib/data.ts` centralises this check; all data fetchers use it.
- **Admin route groups:** `(auth)/` — login only, no shell. `(panel)/` — all authenticated pages; `layout.tsx` calls `auth()` and redirects if no session.
- **Agent registry:** `src/lib/agents/index.ts` exports `AGENT_RUNNERS` — register new agents here for the "Run now" button to work.
- See `docs/ARCHITECTURE.md` for the full system design.

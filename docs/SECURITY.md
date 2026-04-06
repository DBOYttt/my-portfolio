# Security Model

## Threat Model

This is a personal portfolio site with a private admin panel on the same server.
The primary risks are:

1. **Unauthorised admin access** — someone gaining access to the CMS or AI feeds
2. **Secret exposure** — API keys or DB credentials leaked via code or logs
3. **Contact form abuse** — spam or DoS via the public contact endpoint
4. **Self-hosted tool exposure** — n8n or other tools accessible without auth
5. **Dependency vulnerabilities** — unpatched npm packages

---

## Authentication

### Admin login
- Single admin user, created via `npm run db:seed`
- Password hashed with bcrypt (cost factor 12)
- Auth.js database sessions (not JWT — allows instant revocation)
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`
- Session expiry: 24 hours, rolling refresh on activity

### Route protection
- `src/middleware.ts` intercepts all `/admin/*` requests
- Checks for `next-auth.session-token` cookie
- No session → redirect to `/admin/login?callbackUrl=...`
- Unauthenticated requests return a redirect, not a 401 (avoids confirming the route exists)

### Admin API routes
Every `/api/admin/*` route must validate the session at the top:
```typescript
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  // ... rest of handler
}
```

Never rely solely on middleware for API route protection.

---

## Secret Management

### Rules
- All secrets live in `.env` (local) or server environment variables (production)
- `.env` is in `.gitignore` — never commit it
- `.env.example` documents key names with placeholder values only
- No secrets in code, comments, or logs
- No secrets in Docker images — pass via environment at runtime

### Generating secrets
```bash
# AUTH_SECRET
openssl rand -base64 32

# Admin password — use a password manager
```

### Secret rotation
If a secret is accidentally committed:
1. Rotate it immediately at the source (Anthropic dashboard, GitHub settings, etc.)
2. Update `.env` on all deployments
3. Rewrite git history to remove the commit: `git filter-branch` or `git-filter-repo`
4. Force push — then rotate again (assume it was scraped)

---

## Contact Form

The `/api/contact` endpoint is public. Protections applied:

- **Rate limiting:** 5 requests per IP per hour (in-memory for MVP; use Upstash Redis in production)
- **Input validation:** name, email format, message presence checked server-side
- **No reflection:** form data is never echoed back in the response
- **Honeypot field:** (TODO: Milestone 2) Hidden field that bots fill in; humans don't

For production, move rate limiting to Upstash Redis to survive server restarts:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
```

---

## Self-Hosted Tools (n8n, etc.)

### The rule
**Never expose self-hosted tools directly on the public portfolio domain without authentication.**

### Recommended approach by security level

| Level | Setup | When to use |
|---|---|---|
| Highest | Tailscale (WireGuard VPN) — tools only on VPN | Always recommended for sensitive tools |
| High | Nginx IP allowlist on tools subdomain | Home static IP or office |
| Medium | Nginx `auth_request` to validate Next.js session | Accessible from any network, still auth-gated |
| Avoid | Direct port exposure or no auth | Never |

### Tailscale setup (recommended)
```bash
# Install Tailscale on VPS
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Install on your phone/laptop too
# Then access n8n at http://100.x.x.x:5678 (Tailscale IP)
```

The admin panel shows a "Open n8n" link. With Tailscale, that link uses the Tailscale IP.
Without Tailscale, the link is a reminder that VPN access is required.

### What to NOT do
- Do not add n8n to the public Nginx config without an IP allowlist
- Do not share the tools subdomain URL publicly
- Do not use HTTP basic auth as the only protection for n8n (weak)

---

## HTTP Security Headers

Set in `next.config.mjs` for all routes:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

Additional headers to add in Nginx for production:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

CSP policy should be tightened in Milestone 5. Start with `default-src 'self'` and add exceptions as needed.

---

## Admin Panel Exposure

- `/admin` routes return 404 to unauthenticated requests (don't confirm the path exists)
- Admin routes are not listed in `sitemap.xml`
- `robots.txt` should include `Disallow: /admin`
- No links to `/admin` from public pages

---

## Dependency Security

```bash
npm audit                  # Check for known vulnerabilities
npm audit fix              # Auto-fix where possible
npm outdated               # See what can be updated
```

Run `npm audit` before every deployment. Add to CI in Milestone 2.

High/critical vulnerabilities in direct dependencies must be resolved before deployment.

---

## Audit Logging

Every admin action writes to the `AuditLog` table:

```typescript
await prisma.auditLog.create({
  data: {
    action: "post.published",
    entityId: post.id,
    metadata: { title: post.title, slug: post.slug }
  }
});
```

The audit log is append-only. No delete route. View in admin settings (Milestone 3).

---

## Data Privacy

- Contact form messages: delivered via email (Resend) and not stored in the DB by default
- If you choose to store contact messages in the DB, add a data retention policy and inform users
- Agent `rawData` JSON is stored in the DB but never exposed publicly — admin-only
- No analytics cookies by default. Umami (Milestone 5) is cookie-free.
- If you add newsletter signup, GDPR compliance is required (explicit opt-in, unsubscribe link, data deletion)

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true when the request is allowed, false when the caller is rate-limited.
 * State is kept in a module-level Map (process-scoped; resets on server restart).
 */
export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

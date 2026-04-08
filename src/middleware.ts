import { NextRequest, NextResponse } from "next/server";

// Lightweight Edge-compatible middleware — checks cookie presence only.
// Real session validity is enforced by auth() in src/app/admin/(panel)/layout.tsx
// (which runs in the Node.js runtime, not Edge).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin/login")) {
    // Auth.js v5 JWT strategy cookie names (dev / prod)
    const sessionToken =
      request.cookies.get("authjs.session-token") ??
      request.cookies.get("__Secure-authjs.session-token") ??
      request.cookies.get("next-auth.session-token") ??
      request.cookies.get("__Secure-next-auth.session-token") ??
      request.cookies.get("__Secure-authjs.session-token.0") ??
      request.cookies.get("authjs.session-token.0");

    if (!sessionToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

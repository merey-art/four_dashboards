import type { NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { canAccessDashboardRoute, defaultPostLoginHref, deptHomePath } from "@/lib/constants";

const dashboardMiddleware = withAuth(
  function auth(req) {
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;
    const path = req.nextUrl.pathname;

    if (!role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/dashboard") && !canAccessDashboardRoute(role, path)) {
      const home = deptHomePath(role) ?? defaultPostLoginHref(role);
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

/**
 * NextAuth сверяет origin с NEXTAUTH_URL. На локалке при другом порте (3001 vs 3000 в .env)
 * вход падает. С AUTH_TRUST_HOST=true в .env origin берётся из Host + x-forwarded-proto;
 * здесь для /api/auth при необходимости выставляем proto, чтобы не получить https на http.
 */
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    const requestHeaders = new Headers(req.headers);
    if (!requestHeaders.has("x-forwarded-proto")) {
      requestHeaders.set("x-forwarded-proto", req.nextUrl.protocol === "https:" ? "https" : "http");
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return dashboardMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/:path*"],
};

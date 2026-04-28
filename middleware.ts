import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { canAccessDashboardRoute, defaultPostLoginHref, deptHomePath } from "@/lib/constants";

export default withAuth(
  function middleware(req) {
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

export const config = {
  matcher: ["/dashboard/:path*"],
};

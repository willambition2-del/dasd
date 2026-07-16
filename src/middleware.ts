import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "instagram_bot_session";
const JWT_SECRET = process.env.AUTH_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/conversations") ||
    pathname.startsWith("/knowledge") ||
    pathname.startsWith("/rules") ||
    pathname.startsWith("/settings") ||
    (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/login") &&
      !pathname.startsWith("/api/webhooks") &&
      !pathname.startsWith("/api/health"));

  if (isProtectedPath) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      if (!JWT_SECRET) {
        throw new Error("AUTH_SECRET is not configured");
      }
      const key = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, key, { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "انتهت صلاحية الجلسة" }, { status: 401 });
      }
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set(COOKIE_NAME, "", { maxAge: 0 });
      return response;
    }
  }

  // Redirect to dashboard if logged-in user tries to access /login
  if (pathname === "/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token && JWT_SECRET) {
      try {
        const key = new TextEncoder().encode(JWT_SECRET);
        await jwtVerify(token, key, { algorithms: ["HS256"] });
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Token is invalid, let them login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/conversations/:path*",
    "/knowledge/:path*",
    "/rules/:path*",
    "/settings/:path*",
    "/login",
    "/api/:path*",
  ],
};

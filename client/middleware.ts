import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const userType = request.cookies.get("userType")?.value;

  if (!token) {
    if (request.nextUrl.pathname.includes("admin-panel"))
      return NextResponse.redirect(new URL("/login", request.url));
    if (request.nextUrl.pathname.includes("retailer-panel"))
      return NextResponse.redirect(new URL("/retailer-login", request.url));
  } else {
    if (
      userType === "RETAILER" &&
      (request.nextUrl.pathname.includes("admin-panel") ||
        request.nextUrl.pathname.includes("login"))
    )
      return NextResponse.redirect(new URL("/retailer-panel", request.url));
    if (
      userType === "ADMIN" &&
      (request.nextUrl.pathname.includes("retailer-panel") ||
        request.nextUrl.pathname.includes("retailer-login"))
    )
      return NextResponse.redirect(new URL("/admin-panel", request.url));
  }

  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    "/admin-panel/:path*",
    "/retailer-panel/:path*",
    "/login",
    "/retailer-login",
  ],
};

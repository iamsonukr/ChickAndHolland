import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";
import {
  getFirstAccessibleAdminRoute,
  hasAdminRouteAccess,
  parseRolePermissions,
} from "./lib/adminPermissions";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const userType = request.cookies.get("userType")?.value;
  const pathname = request.nextUrl.pathname;

  if (!token) {
    if (pathname.includes("admin-panel"))
      return NextResponse.redirect(new URL("/login", request.url));
    if (pathname.includes("retailer-panel"))
      return NextResponse.redirect(new URL("/retailer-login", request.url));
  } else {
    if (
      userType === "RETAILER" &&
      (pathname.includes("admin-panel") || pathname.includes("login"))
    )
      return NextResponse.redirect(new URL("/retailer-panel", request.url));
    if (
      userType === "ADMIN" &&
      (pathname.includes("retailer-panel") || pathname.includes("retailer-login"))
    )
      return NextResponse.redirect(new URL("/admin-panel", request.url));

    if (userType === "ADMIN" && pathname.startsWith("/admin-panel")) {
      const permissions = parseRolePermissions(
        request.cookies.get("rolePermissions")?.value,
      );

      if (!hasAdminRouteAccess(pathname, permissions)) {
        const redirectPath =
          getFirstAccessibleAdminRoute(permissions) ?? "/login";

        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
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

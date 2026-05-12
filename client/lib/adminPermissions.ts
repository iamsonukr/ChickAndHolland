const ADMIN_PERMISSION_ROUTES = [
  "/admin-panel/",
  "/admin-panel/bank",
  "/admin-panel/users",
  "/admin-panel/user-roles",
  "/admin-panel/settings",
  "/admin-panel/contactus",
  "/admin-panel/orders",
  "/admin-panel/orders/qr-scan",
  "/admin-panel/order-list",
  "/admin-panel/request",
  "/admin-panel/products/categories",
  "/admin-panel/products/collections",
  "/admin-panel/products/colours",
  "/admin-panel/products",
  "/admin-panel/color-chart",
  "/admin-panel/customers",
  "/admin-panel/store-locators",
  "/admin-panel/stock",
  "/admin-panel/sponsor",
  "/admin-panel/expenses/chic-and-holland",
  "/admin-panel/expenses/ozil",
  "/admin-panel/quickbook",
] as const;

const ADMIN_PERMISSION_INHERITANCE: Record<string, readonly string[]> = {
  "/admin-panel/orders/qr-scan": ["/admin-panel/orders"],
  "/admin-panel/settings": ["/admin-panel/users", "/admin-panel/user-roles"],
};

const normalizeRoute = (route: string) => {
  if (route === "/") {
    return route;
  }

  return route.endsWith("/") ? route.slice(0, -1) : route;
};

const routeMatches = (pathname: string, route: string) => {
  const normalizedPath = normalizeRoute(pathname);
  const normalizedRoute = normalizeRoute(route);

  if (normalizedRoute === "/admin-panel") {
    return normalizedPath === normalizedRoute;
  }

  return (
    normalizedPath === normalizedRoute ||
    normalizedPath.startsWith(`${normalizedRoute}/`)
  );
};

const getEffectivePermissionRoutes = (route: string) => {
  const normalizedRoute = normalizeRoute(route);
  const inheritedRoutes = ADMIN_PERMISSION_INHERITANCE[normalizedRoute] ?? [];

  return [
    normalizedRoute,
    ...inheritedRoutes.map((inheritedRoute) => normalizeRoute(inheritedRoute)),
  ];
};

export const parseRolePermissions = (rawPermissions?: string | null) => {
  if (!rawPermissions || rawPermissions === "null") {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(rawPermissions);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getRequiredAdminPermission = (pathname: string) => {
  const matchedRoute = [...ADMIN_PERMISSION_ROUTES]
    .filter((route) => routeMatches(pathname, route))
    .sort((left, right) => normalizeRoute(right).length - normalizeRoute(left).length)[0];

  return matchedRoute ?? null;
};

export const hasAdminRouteAccess = (
  pathname: string,
  permissions: string[],
) => {
  return hasAdminPermissionAccess(
    getRequiredAdminPermission(pathname),
    permissions,
  );
};

export const hasAdminPermissionAccess = (
  route: string | null,
  permissions: string[],
) => {
  if (permissions.includes("ALL")) {
    return true;
  }

  if (!route) {
    return false;
  }

  const allowedRoutes = new Set(getEffectivePermissionRoutes(route));

  return permissions.some(
    (permission) => allowedRoutes.has(normalizeRoute(permission)),
  );
};

export const getFirstAccessibleAdminRoute = (permissions: string[]) => {
  if (permissions.includes("ALL")) {
    return "/admin-panel";
  }

  const firstAllowedRoute = ADMIN_PERMISSION_ROUTES.find((route) =>
    permissions.some(
      (permission) => normalizeRoute(permission) === normalizeRoute(route),
    ),
  );

  if (!firstAllowedRoute) {
    return null;
  }

  return normalizeRoute(firstAllowedRoute);
};

export { ADMIN_PERMISSION_ROUTES };

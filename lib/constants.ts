/** Роли приложения • хранится в таблице User и в JWT */
export type AppRole =
  | "DIRECTOR"
  | "CLIENT_SERVICE"
  | "LOGISTICS"
  | "LEGAL"
  | "ACCOUNTING";

/** Slug-сегменты маршрутов дашбордов */
export const DASHBOARD_PATHS = {
  clientService: "clients-service",
  logistics: "logistics",
  legal: "legal",
  accounting: "accounting",
} as const;

export function deptHomePath(role: string): string | null {
  switch (role) {
    case "CLIENT_SERVICE":
      return `/dashboard/${DASHBOARD_PATHS.clientService}`;
    case "LOGISTICS":
      return `/dashboard/${DASHBOARD_PATHS.logistics}`;
    case "LEGAL":
      return `/dashboard/${DASHBOARD_PATHS.legal}`;
    case "ACCOUNTING":
      return `/dashboard/${DASHBOARD_PATHS.accounting}`;
    default:
      return null;
  }
}

/** Куда отправлять после входа */
export function defaultPostLoginHref(role: string): string {
  if (role === "DIRECTOR") return "/dashboard";
  return deptHomePath(role) ?? "/dashboard";
}

export function canAccessDashboardRoute(role: string, pathname: string): boolean {
  if (!pathname.startsWith("/dashboard")) return true;
  if (role === "DIRECTOR") return true;

  const home = deptHomePath(role);
  if (!home) return false;
  return pathname === home || pathname.startsWith(`${home}/`);
}

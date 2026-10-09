export const roles = [
  "USER",
  "CORPORATE_USER",
  "DRIVER",
  "SALES_REP",
  "OPERATIONS_STAFF",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type AppRole = (typeof roles)[number];

const adminRoles: AppRole[] = ["ADMIN", "SUPER_ADMIN"];

export function canAccessAdmin(role?: string | null, status?: string | null) {
  return Boolean(
    status === "ACTIVE" && role && adminRoles.includes(role as AppRole),
  );
}

export function canManageSystemSettings(role?: string | null) {
  return role === "SUPER_ADMIN";
}

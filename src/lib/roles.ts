export type UserRole = "owner" | "executive" | "admin" | "mod" | "user";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  executive: 3,
  admin: 2,
  mod: 1,
  user: 0,
};

export function hasMinRole(userRole: UserRole | undefined, required: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function isStaff(role: UserRole | undefined): boolean {
  return hasMinRole(role, "mod");
}

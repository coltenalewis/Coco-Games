export type UserRole = "owner" | "executive" | "admin" | "developer" | "mod" | "contractor" | "user";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 6,
  executive: 5,
  admin: 4,
  developer: 3,
  mod: 2,
  contractor: 1,
  user: 0,
};

export function hasMinRole(userRole: UserRole | undefined, required: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function isStaff(role: UserRole | undefined): boolean {
  return hasMinRole(role, "mod");
}

export function isTeam(role: UserRole | undefined): boolean {
  return hasMinRole(role, "contractor");
}

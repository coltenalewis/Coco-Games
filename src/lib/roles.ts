export type UserRole = "owner" | "executive" | "admin" | "developer" | "coordinator" | "qa" | "mod" | "contractor" | "user";

export const ALL_ROLES: UserRole[] = ["owner", "executive", "admin", "developer", "coordinator", "qa", "mod", "contractor", "user"];

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 8,
  executive: 7,
  admin: 6,
  developer: 5,
  coordinator: 4,
  qa: 3,
  mod: 2,
  contractor: 1,
  user: 0,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  executive: "Executive",
  admin: "Admin",
  developer: "Developer",
  coordinator: "Coordinator",
  qa: "Quality Assurance",
  mod: "Moderator",
  contractor: "Contractor",
  user: "User",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  owner: "bg-coco-ember text-white border-coco-ember",
  executive: "bg-green-100 text-green-700 border-green-400",
  admin: "bg-red-100 text-red-700 border-red-300",
  developer: "bg-violet-100 text-violet-700 border-violet-300",
  coordinator: "bg-cyan-100 text-cyan-700 border-cyan-300",
  qa: "bg-teal-100 text-teal-700 border-teal-300",
  mod: "bg-blue-100 text-blue-700 border-blue-300",
  contractor: "bg-amber-100 text-amber-700 border-amber-300",
  user: "bg-gray-100 text-gray-600 border-gray-300",
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

export function getRoleLevel(role: UserRole | undefined): number {
  if (!role) return -1;
  return ROLE_HIERARCHY[role] ?? -1;
}

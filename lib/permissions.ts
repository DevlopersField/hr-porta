// lib/permissions.ts

// ============= PERMISSION ENUM =============
export const PERMISSIONS = {
  // People & users
  VIEW_ALL_PEOPLE: 'view_all_people',
  EDIT_USER_PROFILES: 'edit_user_profiles',
  MANAGE_PERMISSIONS: 'manage_permissions',
  CREATE_USERS: 'create_users',
  DEACTIVATE_USERS: 'deactivate_users',
  // Leave
  APPROVE_LEAVE: 'approve_leave',
  VIEW_TEAM_LEAVE: 'view_team_leave',
  VIEW_ALL_LEAVE: 'view_all_leave',
  // Attendance
  VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
  VIEW_ALL_ATTENDANCE: 'view_all_attendance',
  EDIT_ATTENDANCE_RECORDS: 'edit_attendance_records',
  // Salary
  VIEW_ALL_SALARY: 'view_all_salary',
  EDIT_SALARY: 'edit_salary',
  GENERATE_PAYSLIPS: 'generate_payslips',
  // Requests
  APPROVE_REQUESTS: 'approve_requests',
  VIEW_ALL_REQUESTS: 'view_all_requests',
  // Content
  EDIT_DOCUMENTS: 'edit_documents',
  EDIT_HELPDESK: 'edit_helpdesk',
  PUBLISH_ENGAGE: 'publish_engage',
  // Workflow
  MANAGE_DELEGATES: 'manage_delegates',
  // Settings
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// ============= ERRORS =============
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// ============= HELPERS =============
type UserShape = { permissions: string[] };

export function hasPermission(user: UserShape, perm: Permission): boolean {
  return user.permissions.includes('*') || user.permissions.includes(perm);
}

export function hasAnyPermission(user: UserShape, perms: Permission[]): boolean {
  return perms.some(p => hasPermission(user, p));
}

export function requirePermission(user: UserShape, perm: Permission): void {
  if (!hasPermission(user, perm)) {
    throw new ForbiddenError(`Missing permission: ${perm}`);
  }
}

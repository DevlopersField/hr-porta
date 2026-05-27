// lib/permissions.test.ts
import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  requirePermission,
  ForbiddenError,
  PERMISSIONS,
  canViewPeople,
} from './permissions';

describe('hasPermission', () => {
  it('returns true when the user has the exact permission', () => {
    const user = { permissions: ['view_all_people'] };
    expect(hasPermission(user, 'view_all_people')).toBe(true);
  });

  it("returns true when the user has the '*' wildcard", () => {
    const user = { permissions: ['*'] };
    expect(hasPermission(user, 'manage_settings')).toBe(true);
  });

  it('returns false when the user has neither the permission nor the wildcard', () => {
    const user = { permissions: ['view_all_people'] };
    expect(hasPermission(user, 'manage_settings')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true when at least one matches', () => {
    const user = { permissions: ['approve_leave'] };
    expect(hasAnyPermission(user, ['manage_settings', 'approve_leave'])).toBe(true);
  });

  it('returns false when none match', () => {
    const user = { permissions: ['view_all_people'] };
    expect(hasAnyPermission(user, ['manage_settings', 'approve_leave'])).toBe(false);
  });
});

describe('requirePermission', () => {
  it('throws ForbiddenError with the right message when user lacks it', () => {
    const user = { permissions: [] };
    try {
      requirePermission(user, 'manage_settings');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as Error).message).toBe('Missing permission: manage_settings');
    }
  });

  it("does NOT throw when user has '*' wildcard", () => {
    const user = { permissions: ['*'] };
    expect(() => requirePermission(user, 'manage_settings')).not.toThrow();
  });
});

describe('canViewPeople', () => {
  it('returns true for user with VIEW_ALL_PEOPLE', () => {
    expect(canViewPeople({ permissions: ['view_all_people'] })).toBe(true);
  });

  it('returns true for user with EDIT_USER_PROFILES', () => {
    expect(canViewPeople({ permissions: ['edit_user_profiles'] })).toBe(true);
  });

  it('returns true for user with MANAGE_PERMISSIONS', () => {
    expect(canViewPeople({ permissions: ['manage_permissions'] })).toBe(true);
  });

  it('returns true for user with CREATE_USERS', () => {
    expect(canViewPeople({ permissions: ['create_users'] })).toBe(true);
  });

  it('returns true for user with DEACTIVATE_USERS', () => {
    expect(canViewPeople({ permissions: ['deactivate_users'] })).toBe(true);
  });

  it("returns true for super-admin (wildcard '*')", () => {
    expect(canViewPeople({ permissions: ['*'] })).toBe(true);
  });

  it('returns false for user with no people permissions', () => {
    expect(canViewPeople({ permissions: [] })).toBe(false);
  });

  it('returns false for user with unrelated permissions only', () => {
    expect(canViewPeople({ permissions: ['manage_settings', 'approve_leave'] })).toBe(false);
  });
});

describe('PERMISSIONS constants', () => {
  it('MANAGE_SETTINGS is the snake_case string', () => {
    expect(PERMISSIONS.MANAGE_SETTINGS).toBe('manage_settings');
  });

  it('VIEW_ALL_PEOPLE is the snake_case string', () => {
    expect(PERMISSIONS.VIEW_ALL_PEOPLE).toBe('view_all_people');
  });

  it('APPROVE_LEAVE is the snake_case string', () => {
    expect(PERMISSIONS.APPROVE_LEAVE).toBe('approve_leave');
  });

  it('EDIT_SALARY is the snake_case string', () => {
    expect(PERMISSIONS.EDIT_SALARY).toBe('edit_salary');
  });
});

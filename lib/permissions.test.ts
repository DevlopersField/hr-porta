// lib/permissions.test.ts
import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  requirePermission,
  ForbiddenError,
  PERMISSIONS,
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

// lib/db/users.ts

// ============= IMPORTS =============
import { z } from 'zod';
import crypto from 'node:crypto';
import { readJson, updateJson } from './core';

// ============= SCHEMA =============
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  displayName: z.string(),
  avatarPath: z.string().nullable().default(null),
  department: z.string().default(''),
  jobTitle: z.string().default(''),
  managerId: z.string().nullable().default(null),
  permissions: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable().default(null),
  passwordResetToken: z.string().nullable().default(null),
  mustChangePassword: z.boolean().default(false),
});
export type User = z.infer<typeof UserSchema>;

export const UsersFileSchema = z.object({
  users: z.array(UserSchema),
});
export type UsersFile = z.infer<typeof UsersFileSchema>;

const EMPTY: UsersFile = { users: [] };
const PATH = 'users.json';

// ============= READS =============
export async function listUsers(): Promise<User[]> {
  const data = await readJson(PATH, UsersFileSchema, EMPTY);
  return data.users;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await listUsers();
  return users.find(u => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await listUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

// ============= WRITES =============
export type CreateUserInput = {
  email: string;
  passwordHash: string;
  displayName: string;
  permissions?: string[];
  department?: string;
  jobTitle?: string;
  managerId?: string | null;
  mustChangePassword?: boolean;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  return updateJson(PATH, UsersFileSchema, EMPTY, (current) => {
    if (current.users.some(u => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error(`User with email ${input.email} already exists`);
    }
    const newUser: User = {
      id: `u_${crypto.randomBytes(8).toString('hex')}`,
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      avatarPath: null,
      department: input.department ?? '',
      jobTitle: input.jobTitle ?? '',
      managerId: input.managerId ?? null,
      permissions: input.permissions ?? [],
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      passwordResetToken: null,
      mustChangePassword: input.mustChangePassword ?? false,
    };
    return { users: [...current.users, newUser] };
  }).then(result => result.users[result.users.length - 1]!);
}

export async function updateUserPermissions(id: string, permissions: string[]): Promise<void> {
  await updateJson(PATH, UsersFileSchema, EMPTY, (current) => ({
    users: current.users.map(u => u.id === id ? { ...u, permissions } : u),
  }));
}

export async function updateUserProfile(
  id: string,
  patch: Partial<Pick<User, 'displayName' | 'department' | 'jobTitle' | 'managerId' | 'avatarPath'>>,
): Promise<void> {
  await updateJson(PATH, UsersFileSchema, EMPTY, (current) => ({
    users: current.users.map(u => u.id === id ? { ...u, ...patch } : u),
  }));
}

export async function deactivateUser(id: string): Promise<void> {
  await updateJson(PATH, UsersFileSchema, EMPTY, (current) => ({
    users: current.users.map(u => u.id === id ? { ...u, active: false } : u),
  }));
}

export async function setPasswordHash(id: string, passwordHash: string, mustChange = false): Promise<void> {
  await updateJson(PATH, UsersFileSchema, EMPTY, (current) => ({
    users: current.users.map(u => u.id === id ? { ...u, passwordHash, mustChangePassword: mustChange, passwordResetToken: null } : u),
  }));
}

export async function setPasswordResetToken(id: string, token: string | null): Promise<void> {
  await updateJson(PATH, UsersFileSchema, EMPTY, (current) => ({
    users: current.users.map(u => u.id === id ? { ...u, passwordResetToken: token } : u),
  }));
}

export async function touchLastLogin(id: string): Promise<void> {
  await updateJson(PATH, UsersFileSchema, EMPTY, (current) => ({
    users: current.users.map(u => u.id === id ? { ...u, lastLoginAt: new Date().toISOString() } : u),
  }));
}

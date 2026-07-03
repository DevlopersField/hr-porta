// lib/db/profiles.ts

// ============= IMPORTS =============
import { z } from 'zod';
import { readJson, updateJson } from './core';

// ============= SCHEMA =============
export const ProfileSchema = z.object({
  userId: z.string(),
  phone: z.string().default(''),
  address: z.string().default(''),
  dateOfBirth: z.string().default(''), // 'YYYY-MM-DD' or ''
  pronouns: z.string().default(''),
  bio: z.string().default(''),
  emergencyContactName: z.string().default(''),
  emergencyContactPhone: z.string().default(''),
  emergencyContactRelation: z.string().default(''),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileFileSchema = z.object({
  profile: ProfileSchema,
});
export type ProfileFile = z.infer<typeof ProfileFileSchema>;

// ============= HELPERS =============
function defaultProfile(userId: string): Profile {
  return {
    userId,
    phone: '',
    address: '',
    dateOfBirth: '',
    pronouns: '',
    bio: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  };
}

function pathFor(userId: string): string {
  return `profiles/${userId}.json`;
}

// ============= READS =============
export async function getProfile(userId: string): Promise<Profile> {
  const fallback: ProfileFile = { profile: defaultProfile(userId) };
  const data = await readJson(pathFor(userId), ProfileFileSchema, fallback);
  return data.profile;
}

// ============= WRITES =============
export async function upsertProfile(
  userId: string,
  patch: Partial<Omit<Profile, 'userId'>>,
): Promise<Profile> {
  const fallback: ProfileFile = { profile: defaultProfile(userId) };
  const result = await updateJson(pathFor(userId), ProfileFileSchema, fallback, (current) => ({
    profile: { ...current.profile, ...patch, userId },
  }));
  return result.profile;
}

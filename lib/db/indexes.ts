// lib/db/indexes.ts

// ============= IMPORTS =============
import { z } from 'zod';
import { updateJson } from './core';
import { listUsers } from './users';

// ============= PEOPLE SEARCH INDEX =============
const PeopleSearchSchema = z.object({
  entries: z.array(z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    department: z.string(),
    jobTitle: z.string(),
    active: z.boolean(),
    searchBlob: z.string(),
  })),
});

const PEOPLE_SEARCH_PATH = 'indexes/people-search.json';

export async function rebuildPeopleSearchIndex(): Promise<void> {
  const users = await listUsers();
  const entries = users.map(u => ({
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    department: u.department,
    jobTitle: u.jobTitle,
    active: u.active,
    searchBlob: [u.displayName, u.email, u.department, u.jobTitle].join(' ').toLowerCase(),
  }));
  await updateJson(PEOPLE_SEARCH_PATH, PeopleSearchSchema, { entries: [] }, () => ({ entries }));
}

export async function readPeopleSearchIndex() {
  const { readJson } = await import('./core');
  return readJson(PEOPLE_SEARCH_PATH, PeopleSearchSchema, { entries: [] });
}

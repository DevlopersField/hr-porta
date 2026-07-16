// lib/project-status.ts
// Shared project/task lifecycle status vocabulary. Pure constants with no
// I/O — safe to import from client components (unlike lib/db/projects.ts,
// which pulls in node:fs transitively via lib/db/core.ts and would break a
// client bundle).

export const PROJECT_STATUSES = ['discuss', 'design', 'development', 'qa', 'uat', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

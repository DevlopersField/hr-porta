/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/db/migrations.ts

// ============= TYPES =============
type Migration<T> = (old: any) => T;
type MigrationMap<T> = Record<number, Migration<T>>;

// ============= GENERIC RUNNER =============
export function migrate<T extends { version?: number }>(
  data: any,
  migrations: MigrationMap<T>,
  currentVersion: number,
): T {
  let v = data.version ?? 1;
  let result = data;
  while (v < currentVersion) {
    const fn = migrations[v];
    if (!fn) throw new Error(`No migration from version ${v}`);
    result = fn(result);
    v += 1;
  }
  return result;
}

// lib/format-hours.ts
// Pure hours formatting, split out from lib/db/timesheets.ts so client
// components (e.g. components/ui/ProjectBoard.tsx) can use it without
// pulling in lib/db/core.ts's node:fs-based I/O into the client bundle.

export function formatHoursHM(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

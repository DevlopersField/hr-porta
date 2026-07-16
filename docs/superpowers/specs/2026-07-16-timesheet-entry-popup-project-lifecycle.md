# Timesheet entry popup + project lifecycle page

**Date:** 2026-07-16
**Status:** approved

## Problem

The timesheet page mixes three concerns on one screen: the weekly grid,
a scrolled list of per-day entry cards (`#day-<date>` anchors) used only
for edit/delete, and an admin project-management panel. Clicking a
filled grid cell jumps/scrolls to that list instead of opening the entry
directly. Projects have no due date or lifecycle status, and project
management clutters the timesheet page.

## Changes

### 1. Grid cell click → edit modal (no scroll)

- Remove the "Entries" day-grouped `GlassPanel` list and `EntryRow` component entirely.
- Filled grid cells become a `<Link href={weekHref(weekStart, `&edit=${entryId}`)}>` (reusing the
  existing edit `Modal` already wired to `?edit=`) instead of `<a href="#day-...">`.
- If a cell holds multiple entries (same project/task row, same day — can't happen today since
  grid rows are keyed by `projectId|taskId` and cells sum by date, so at most the cell shows a
  sum). Clicking a summed cell opens the edit modal for the most recent entry (`createdAt` desc)
  in that project/task/day; the modal already shows one entry per open, matching current behavior.

### 2. Project schema: lifecycle status + due date

`lib/db/projects.ts` `ProjectSchema`:
- Replace `active: boolean` with `status: 'discuss' | 'design' | 'development' | 'qa' | 'delivered' | 'maintenance'`.
- Add `dueDate: string | null` (YYYY-MM-DD, nullable), default `null`.
- `active` semantics (can still log time against it) becomes: any status except none excluded —
  all statuses are loggable EXCEPT none are archived-only; instead we keep a separate concept:
  **loggable = status !== 'delivered' meaning not automatically blocked** — actually simplify:
  keep logging allowed for all statuses (a "maintenance" project still gets time logged). Drop the
  archive/restore action; there is no more "inactive" project, only status transitions. Existing
  `setProjectActive` action/fn is removed and replaced by `setProjectStatusAction` / `setProjectDueDateAction`.
- Migration: `readJson`'s Zod parse needs a default for old records missing `status`/`dueDate` —
  old `active: true` → `status: 'development'` default is NOT automatic via Zod on real data (no
  data currently has projects — `data/projects.json` doesn't exist yet in this env), so no runtime
  migration code needed; schema default for `status` is `'discuss'` and for `dueDate` is `null`.

### 3. New page `/attendance/timesheet/projects`

- Guarded by `MANAGE_PROJECTS` (`requireSession(PERMISSIONS.MANAGE_PROJECTS)`).
- Lists all projects as cards: name/code, `StatusPill` colored by status (discuss/design =
  default tone, development = amber-ish "in progress" tone, qa = amber, delivered = green,
  maintenance = green-muted — use existing `StatusPill` tone options `green|amber|red`, mapping:
  discuss/design/development/qa → amber, delivered/maintenance → green), due date, **total hours
  logged against the project across ALL users, all-time** (new aggregate function), task list,
  inline forms to change status (select) and due date (date input), add-task form (existing),
  create-project entry point (reuse existing `?newProject=1` modal, now opened from this page).
- Timesheet page (`/attendance/timesheet`) header gets a "Manage projects" link (visible when
  `MANAGE_PROJECTS`) instead of the embedded project panel; the embedded panel section is deleted.

### 4. New aggregate query

`lib/db/timesheets.ts`: `sumHoursForProjectAllUsers(projectId: string, userIds: string[]): Promise<number>`
— reads every user's shard (only for users passed in, i.e. all `listUsers()` ids) and sums hours
for that project. Used by the new Projects page only (low traffic, admin-only page — fine to be
O(users) file reads).

## Out of scope

- No due-date reminders/notifications.
- No per-status permissions (any `MANAGE_PROJECTS` holder can set any status).
- No change to the Log Time modal's project/task `<select>` — already a grouped dropdown.

## Testing

- `lib/db/projects.test.ts`: extend/update for `status`/`dueDate` fields, `setProjectStatus`, `setProjectDueDate`.
- `lib/db/timesheets.test.ts`: add test for `sumHoursForProjectAllUsers`.
- Existing timesheet page tests (if any) updated for removed entry-list markup; new projects page
  smoke-tested manually via Playwright (no existing page-level test suite to extend).

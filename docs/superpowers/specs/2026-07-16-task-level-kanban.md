# Task-level kanban + project as a plain wrapper + dark-mode scrollbars

**Date:** 2026-07-16
**Status:** approved

## Problem

The board shipped earlier today moves whole *projects* across lifecycle columns.
That's wrong: a project should be a plain container (name, code, description,
due date, delete) — the Trello-style board belongs to its **tasks**, which
already carry their own status/description/due date. Also: scrollbars look
wrong/default in dark mode across the app (no themed scrollbar styling exists
anywhere yet).

## Changes

### 1. Project becomes a plain wrapper — drop `status`

`lib/db/projects.ts`: remove `status` from `ProjectSchema` entirely (Zod
silently strips unknown keys on read, so old `status` values in
`data/projects.json` are dropped harmlessly on next write — no migration
code needed). Remove `setProjectStatus`. `PROJECT_STATUSES`/`ProjectStatus`
stay — they now describe **task** status only, still
`['discuss','design','development','qa','uat','completed']` (unchanged
vocabulary, just re-scoped to tasks). Project keeps: `id, name, code,
description, dueDate, tasks, createdAt`.

### 2. Projects page → plain list (`/attendance/timesheet/projects`)

Replace the kanban board on this page with a simple grid of project cards
(`card-panel` style, not draggable): name/code, description (line-clamped),
due date, hours logged (existing `sumHoursForProjectAllUsers`), task count,
a "Delete" button (same guard as today — blocked if any hours logged), and
an "Open board" link to the project's own task board (see #3). "New project"
modal unchanged (still just name/code/description — no status field to set,
it never had one at creation).

### 3. New task board page (`/attendance/timesheet/projects/[projectId]`)

The actual Trello board, scoped to one project's tasks:

- Reuse/adapt the existing `components/ui/ProjectBoard.tsx` client component
  — rename conceptually to operate on tasks instead of projects (same 6
  columns, same drag-and-drop mechanics, same optimistic-update-with-rollback
  pattern). Card shows: task name, description snippet, due date.
- Drop a task card into a new column → calls a new
  `moveProjectTaskStatusAction(projectId: string, taskId: string, status: ProjectStatus): Promise<void>`
  (plain args, no FormData, no redirect — same shape as the old
  `moveProjectStatusAction` it replaces).
- Click a task card → opens `?task=<id>` detail modal (reusing `Modal`):
  edit name/description/due date/status via the existing
  `updateProjectTaskAction` (already supports all four fields — no data-layer
  change needed here, just a new place to call it from).
- "Add task" → `?newTask=1` modal with name (required) + description + due
  date (reuses `addProjectTaskAction`, unchanged).
- Page header: project name/code, description, due date, "Back to projects"
  link. No project-level delete here — that lives on the list page (#2) to
  avoid duplicating the guarded action in two places.
- Guarded by `MANAGE_PROJECTS`, 404s (via `notFound()`) if the project id
  doesn't exist.

### 4. Dark-mode scrollbars

`app/globals.css`: add themed scrollbar rules using both `scrollbar-color`/
`scrollbar-width` (Firefox) and `::-webkit-scrollbar*` (Chromium/Safari),
driven by the existing `--color-surface`/`--color-border`/`--color-text-muted`
tokens so it's automatically correct in both palettes — thin track/thumb,
rounded, no arrows. Apply globally (`html`) rather than special-casing
individual scroll containers (`.gridScroll`, `.board`, sidebar, modal body),
since all of them inherit from the same rule.

## Out of scope

- Task deletion (still not requested).
- Reordering within a column.
- Any change to the Log Time modal.

## Testing

- `lib/db/projects.test.ts`: remove the `status`-on-project tests
  (`setProjectStatus` describe block, the `status`/`discuss` assertions in
  `createProject`/`listProjects` tests) — task-level status tests are
  untouched, they already exist and pass.
- Manual Playwright verification: list page shows wrapper cards (no drag),
  opening a project's board shows 6 task columns, dragging a task card
  persists its status, add/edit task modals work, delete-guard still works
  from the list page, dark mode scrollbar renders themed (visual check).

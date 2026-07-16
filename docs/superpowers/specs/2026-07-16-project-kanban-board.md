# Project kanban board + rich tasks + sidebar entry

**Date:** 2026-07-16
**Status:** approved

## Problem

The current `/attendance/timesheet/projects` page (shipped earlier today) is a flat
list of forms — functional but not "professional." Tasks are name-only. There's no
way to delete a project. The page isn't reachable from the sidebar. The user wants
a ClickUp/Trello-style board: drag project cards between lifecycle-status columns,
richer tasks (name + description + due date + their own status), and project
deletion.

## Changes

### 1. Status vocabulary (renamed, still 6 stages)

`PROJECT_STATUSES` in `lib/db/projects.ts` changes from
`['discuss','design','development','qa','delivered','maintenance']` to
`['discuss','design','development','qa','uat','completed']`. No existing project
data uses `delivered`/`maintenance` (checked `data/projects.json` — only
`discuss`/`development` in use), so this is a safe rename, not a migration.
Board column order: Discuss → Design → Development → QA → UAT → Completed.

### 2. Rich tasks

`ProjectTaskSchema` gains:
- `description: z.string().default('')`
- `dueDate: z.string().nullable().default(null)`
- `status: z.enum(PROJECT_STATUSES).default('discuss')` (same 6 stages as projects)

`addProjectTask` input extends to accept `description`/`dueDate` (still required:
`name`). New `updateProjectTask(projectId, taskId, patch: { name?, description?,
dueDate?, status? })` for editing an existing task's fields (no task deletion —
not requested, keep scope tight).

### 3. Project deletion (guarded)

New `deleteProject(id: string): Promise<void>` in `lib/db/projects.ts` — just
removes it from `projects.json`. The **guard lives in the action layer**:
`deleteProjectAction` computes total hours via the existing
`sumHoursForProjectAllUsers(projectId, userIds)`; if `> 0`, throw
`'Cannot delete a project with logged time'` (surfaces as Next's generic error
page per known issue #8 in CLAUDE.md — acceptable, matches existing error UX for
this app). Otherwise delete and redirect to the board.

### 4. Kanban board UI

`/attendance/timesheet/projects` becomes a board: 6 columns (one per status),
each listing that status's project cards. This needs client-side drag-and-drop,
so:

- New client component `components/ui/ProjectBoard.tsx` (`'use client'`) receives
  the full project list (serializable props) and renders the columns + draggable
  cards using native HTML5 drag events (`draggable`, `onDragStart`, `onDrop`,
  `onDragOver`) — no new dependency needed.
- On drop into a new column, the component calls a new server action
  `moveProjectStatusAction(projectId: string, status: ProjectStatus): Promise<void>`
  directly (plain args, no FormData — server actions are callable like normal
  async functions from client components; Next handles the RPC and refreshes the
  RSC tree, so no manual `router.refresh()` needed). Optimistically move the card
  client-side (`useState` mirroring server data, reconciled on the next server
  render) so the drag feels instant instead of waiting on the round-trip.
- Card shows: name/code, hours logged (via existing per-project totals passed
  down from the page), due date if set, task count. Click anywhere on the card
  (not the drag handle) navigates to `?project=<id>`, opening the existing
  `Modal` component as a **project detail modal**: editable description
  (textarea + Save), due date, a Delete button (guarded per #3), and the task
  list — each task rendered with its own inline edit form (name, description,
  due date, status select, Save), plus an add-task form with all four fields.
  This keeps task editing out of the board view entirely, avoiding modal-in-card
  clutter.
- "New project" stays as today (`?newProject=1`, reusing the existing modal and
  `createProjectAction`).

### 5. Sidebar entry

`components/layout/nav-config.ts`: add a `projects` child under the existing
`attendance` group (alongside `timesheet` and `clock`), `requires:
PERMISSIONS.MANAGE_PROJECTS`, `href: '/attendance/timesheet/projects'`. Matches
the existing pattern of permission-gated children (e.g. `todo.approvals`).

### 6. Timesheet page

No change beyond what already shipped — the "Manage projects" header link
already points at this route; it now lands on the board instead of the flat list.

## Out of scope

- Task deletion.
- Cascade-delete of timesheet entries (delete is blocked instead, per Q&A).
- Reordering cards within a column (only cross-column drag changes status).
- Any change to the Log Time modal's project/task select.

## Testing

- `lib/db/projects.test.ts`: extend for the renamed statuses, task
  description/dueDate/status defaults, `updateProjectTask`, `deleteProject`.
- `lib/db/timesheets.test.ts`: unchanged (no schema touch here).
- Manual Playwright verification of: board renders 6 columns, drag card between
  columns persists status, project detail modal edits description/task fields,
  delete blocked when hours logged / succeeds when zero, sidebar link visible
  only to `MANAGE_PROJECTS` holders.

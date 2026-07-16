// components/ui/ProjectBoard.tsx
// Kanban board for a single project's tasks. Renders one column per
// PROJECT_STATUSES value and lets an admin drag task cards across columns to
// change a task's status. Native HTML5 drag-and-drop — no dependency.
// The server action is passed in as a prop (it must originate from a
// 'use server' file; this component only ever calls what it's handed).

'use client';

// ============= IMPORTS =============
import { useState, useTransition, type DragEvent } from 'react';
import Link from 'next/link';
import type { ProjectTask } from '@/lib/db/projects';
import { PROJECT_STATUSES, type ProjectStatus } from '@/lib/project-status';

import styles from './ProjectBoard.module.css';

// ============= STATUS DISPLAY =============
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  discuss: 'Discuss',
  design: 'Design',
  development: 'Development',
  qa: 'QA',
  uat: 'UAT',
  completed: 'Completed',
};

// ============= TYPES =============
export type BoardTask = ProjectTask;

type Props = {
  tasks: BoardTask[];
  moveAction: (taskId: string, status: ProjectStatus) => Promise<void>;
  // Base path the board lives on (the project's own route); card links
  // append `?task=<id>` to it. A plain string (not a function) — only
  // server actions may cross the server/client component boundary as
  // callable props.
  basePath: string;
};

// ============= COMPONENT =============
export function ProjectBoard({ tasks, moveAction, basePath }: Props) {
  const [items, setItems] = useState<BoardTask[]>(tasks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ProjectStatus | null>(null);
  const [, startTransition] = useTransition();

  function handleDragStart(e: DragEvent<HTMLDivElement>, id: string) {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStatus(null);
  }

  function handleColumnDragOver(e: DragEvent<HTMLDivElement>, status: ProjectStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) setDragOverStatus(status);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, status: ProjectStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setDragOverStatus(null);
    if (!id) return;
    const task = items.find(t => t.id === id);
    if (!task || task.status === status) return;
    // Optimistic move — update local state immediately so the drag feels instant.
    setItems(prev => prev.map(t => (t.id === id ? { ...t, status } : t)));
    startTransition(() => {
      moveAction(id, status).catch(() => {
        // Revert on failure — the server rejected the move.
        setItems(prev => prev.map(t => (t.id === id ? { ...t, status: task.status } : t)));
      });
    });
  }

  return (
    <div className={styles.board}>
      {PROJECT_STATUSES.map(status => {
        const columnTasks = items.filter(t => t.status === status);
        return (
          <div
            key={status}
            className={`${styles.column} ${dragOverStatus === status ? styles.columnDragOver : ''}`}
            onDragOver={e => handleColumnDragOver(e, status)}
            onDragLeave={() => setDragOverStatus(prev => (prev === status ? null : prev))}
            onDrop={e => handleDrop(e, status)}
          >
            <div className={styles.columnHeader}>
              <span className={styles.columnTitle}>{STATUS_LABEL[status]}</span>
              <span className={styles.columnCount}>{columnTasks.length}</span>
            </div>
            <div className={styles.columnBody}>
              {columnTasks.length === 0 && (
                <p className={styles.columnEmpty}>No tasks</p>
              )}
              {columnTasks.map(t => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={e => handleDragStart(e, t.id)}
                  onDragEnd={handleDragEnd}
                  className={`${styles.card} ${draggingId === t.id ? styles.cardDragging : ''}`}
                >
                  <Link href={`${basePath}?task=${t.id}`} className={styles.cardLink}>
                    <span className={styles.cardTitle}>{t.name}</span>
                    {t.description && <span className={styles.cardDescription}>{t.description}</span>}
                    {t.dueDate && <span className={styles.cardDue}>Due {t.dueDate}</span>}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

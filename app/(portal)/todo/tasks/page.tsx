// app/(portal)/todo/tasks/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { listUserTasks } from '@/lib/db/tasks';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { addTaskAction, toggleTaskAction, deleteTaskAction } from './actions';

// ============= PAGE =============
export default async function TasksPage() {
  const user = await requireSession();
  const tasks = (await listUserTasks(user.id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">To do</h1>

      {/* ============= ADD TASK ============= */}
      <GlassPanel className="max-w-md">
        <form action={addTaskAction} className="flex flex-col gap-4">
          <Input name="title" label="Task" required maxLength={200} />
          <Input name="dueDate" type="date" label="Due date (optional)" />
          <Button type="submit" className="self-start">Add task</Button>
        </form>
      </GlassPanel>

      {/* ============= TASK LIST ============= */}
      {tasks.length === 0 ? (
        <GlassPanel>
          <p className="text-sm text-text-muted">No tasks yet.</p>
        </GlassPanel>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map(t => {
            const toggle = async () => { 'use server'; await toggleTaskAction(t.id); };
            const remove = async () => { 'use server'; await deleteTaskAction(t.id); };
            return (
              <GlassPanel key={t.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <form action={toggle}>
                      <Button type="submit" size="sm" variant={t.done ? 'secondary' : 'ghost'}>
                        {t.done ? 'Done' : 'Mark done'}
                      </Button>
                    </form>
                    <div className="flex flex-col">
                      <span className={t.done ? 'text-sm line-through text-text-muted' : 'text-sm'}>{t.title}</span>
                      {t.dueDate && <span className="text-xs text-text-muted">Due {t.dueDate}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={t.done ? 'green' : 'amber'}>{t.done ? 'Complete' : 'Open'}</StatusPill>
                    <form action={remove}>
                      <Button type="submit" size="sm" variant="danger">Delete</Button>
                    </form>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { toggleTask, addTask, deleteTask } from "@/app/w/[id]/actions";

export interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  deliverable_id: string | null;
}

export interface GroupedPlan {
  milestone: { id: string; name: string; target_date: string | null } | null;
  deliverables: {
    id: string | null;
    name: string | null;
    tasks: TaskRow[];
  }[];
}

function dueLabel(due: string | null, done: boolean) {
  if (!due) return null;
  const date = new Date(`${due}T00:00:00`);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const text = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (done) return { text, tone: "text-ink-soft/50" };
  if (days < 0) return { text: `${text} · overdue`, tone: "text-red-600 font-medium" };
  if (days <= 14) return { text: `${text} · soon`, tone: "text-brand-dark font-medium" };
  return { text, tone: "text-ink-soft/60" };
}

function Task({ task, weddingId }: { task: TaskRow; weddingId: string }) {
  const done = Boolean(task.completed_at);
  const due = dueLabel(task.due_date, done);

  return (
    <li className="group flex items-center gap-3 border-b border-stone-2/60 py-3 last:border-0">
      <form action={toggleTask} className="flex">
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="wedding_id" value={weddingId} />
        <input type="hidden" name="completed" value={String(done)} />
        <button
          type="submit"
          aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors ${
            done
              ? "border-brand bg-brand text-white"
              : "border-stone-2 hover:border-brand"
          }`}
        >
          {done && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m20 6-11 11-5-5" />
            </svg>
          )}
        </button>
      </form>

      <span className={`flex-1 text-sm ${done ? "text-ink-soft/50 line-through" : "text-ink"}`}>
        {task.title}
      </span>

      {due && <span className={`text-xs ${due.tone}`}>{due.text}</span>}

      <form action={deleteTask} className="flex">
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="wedding_id" value={weddingId} />
        <button
          type="submit"
          aria-label={`Delete "${task.title}"`}
          className="p-1 text-ink-soft/40 transition-colors hover:text-red-600"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </form>
    </li>
  );
}

export default function TaskList({
  plan,
  weddingId,
}: {
  plan: GroupedPlan[];
  weddingId: string;
}) {
  return (
    <div className="space-y-10">
      {plan.map((group, gi) => (
        <section key={group.milestone?.id ?? `ungrouped-${gi}`}>
          {group.milestone && (
            <header className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium text-ink">{group.milestone.name}</h2>
              {group.milestone.target_date && (
                <span className="text-xs uppercase tracking-wider text-ink-soft/50">
                  {new Date(`${group.milestone.target_date}T00:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </header>
          )}

          <div className="space-y-5">
            {group.deliverables.map((d, di) => (
              <div
                key={d.id ?? `d-${di}`}
                className="rounded-2xl border border-stone-2 bg-white px-6 py-4 shadow-card"
              >
                {d.name && (
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-dark">
                    {d.name}
                  </h3>
                )}
                <ul>
                  {d.tasks.map((t) => (
                    <Task key={t.id} task={t} weddingId={weddingId} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}

      <form
        action={addTask}
        className="flex flex-col gap-3 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-4 sm:flex-row"
      >
        <input type="hidden" name="wedding_id" value={weddingId} />
        <input
          required
          name="title"
          placeholder="Add a task…"
          maxLength={300}
          className="flex-1 rounded-full border border-stone-2 bg-white px-5 py-2.5 text-sm text-ink outline-none focus:border-brand"
        />
        <input
          type="date"
          name="due_date"
          aria-label="Due date"
          className="rounded-full border border-stone-2 bg-white px-5 py-2.5 text-sm text-ink outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white"
        >
          Add
        </button>
      </form>
    </div>
  );
}

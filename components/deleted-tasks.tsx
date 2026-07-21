import { restoreTask, purgeTask } from "@/app/w/[id]/actions";

export interface DeletedTask {
  id: string;
  title: string;
}

/**
 * "Recently deleted" — restore an accidentally deleted task, or remove it for
 * good. Rendered as a collapsible <details> so it stays out of the way until
 * needed. Server component: restore/purge are plain server-action forms.
 */
export default function DeletedTasks({
  tasks,
  weddingId,
}: {
  tasks: DeletedTask[];
  weddingId: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <details className="mt-8 rounded-2xl border border-stone-2 bg-white px-5 py-3 shadow-card">
      <summary className="cursor-pointer text-sm font-medium text-ink-soft/70 hover:text-ink">
        Recently deleted ({tasks.length})
      </summary>
      <ul className="mt-3 divide-y divide-stone-2/60">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <span className="flex-1 text-sm text-ink-soft/60 line-through">{t.title}</span>
            <form action={restoreTask}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="wedding_id" value={weddingId} />
              <button
                type="submit"
                className="rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-brand-dark hover:border-brand"
              >
                Restore
              </button>
            </form>
            <form action={purgeTask}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="wedding_id" value={weddingId} />
              <button
                type="submit"
                aria-label={`Delete "${t.title}" forever`}
                className="text-xs font-medium text-ink-soft/40 hover:text-red-600"
              >
                Delete forever
              </button>
            </form>
          </li>
        ))}
      </ul>
    </details>
  );
}

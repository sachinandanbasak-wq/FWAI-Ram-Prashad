/**
 * The three states every screen must distinguish (PRD §5):
 *   Missing — data not entered yet (amber)
 *   Empty   — nothing exists (neutral)
 *   Failed  — something went wrong (red)
 * Missing and Empty must never look the same.
 */

export function MissingState({
  title,
  items,
  hint,
}: {
  title: string;
  items?: string[];
  hint?: string;
}) {
  return (
    <div className="state-missing p-5">
      <p className="font-semibold">{title}</p>
      {items && items.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm">
          {items.map((item) => (
            <li key={item}>
              <code className="rounded bg-amber-500/15 px-1">{item}</code>
            </li>
          ))}
        </ul>
      )}
      {hint && <p className="mt-2 text-sm">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="state-empty p-5">
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
    </div>
  );
}

export function FailedState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="state-failed p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

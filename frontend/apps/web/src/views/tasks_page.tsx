import { PageHero } from '../ui/page_hero';

export function TasksPage(): JSX.Element {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHero title="Tasks" subtitle="Plan and get things done" tone="amber" />
      <ul className="space-y-2">
        {[{ t: 'Renew insurance', d: 'Aug 15' }, { t: 'Pay rent', d: 'Sep 1' }].map((x) => (
          <li key={x.t} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-card">
            <div>
              <div className="font-medium text-slate-900">{x.t}</div>
              <div className="text-xs text-slate-500">Due {x.d}</div>
            </div>
            <button className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Done</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Header({ title, actionLabel }: { title: string; actionLabel?: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      {actionLabel && (
        <button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}



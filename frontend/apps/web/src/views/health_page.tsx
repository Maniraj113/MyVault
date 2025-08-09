import { PageHero } from '../ui/page_hero';

export function HealthPage(): JSX.Element {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHero title="Health" subtitle="Keep reports and prescriptions" tone="rose" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Reports" />
        <Card title="Prescriptions" />
        <Card title="Insurance" />
        <Card title="Vaccinations" />
      </div>
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

function Card({ title }: { title: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">No items yet</div>
    </div>
  );
}



import { PageHero } from '../ui/page_hero';

export function DocsPage(): JSX.Element {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHero title="Docs & IDs" subtitle="Store your important documents" tone="cyan" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="aspect-[3/4] card bg-surface-100" />
        ))}
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



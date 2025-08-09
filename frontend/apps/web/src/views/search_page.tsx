import { PageHero } from '../ui/page_hero';

export function SearchPage(): JSX.Element {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHero title="Search" subtitle="Find links, notes, docs, expenses and tasks" tone="indigo" />
      <input
        type="search"
        placeholder="Search links, notes, docs, expenses, tasks..."
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
      <div className="text-sm text-slate-500">Results will appear here.</div>
    </div>
  );
}



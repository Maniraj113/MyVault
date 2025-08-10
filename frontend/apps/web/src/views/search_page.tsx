import { PageHero } from '../ui/page_hero';

export function SearchPage(): JSX.Element {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
      </div>
      <input
        type="search"
        placeholder="Search links, notes, docs, expenses, tasks..."
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
      <div className="text-sm text-slate-500">Results will appear here.</div>
    </div>
  );
}



import { PageHeader } from '../ui/page_header';
import { FileImage } from 'lucide-react';

export function DocsPage(): JSX.Element {
  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <PageHeader title="Docs & IDs" icon={<FileImage className="w-8 h-8 text-cyan-600" />} />
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-lg border border-gray-200 bg-white shadow-sm" />
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



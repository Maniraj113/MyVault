import { PageHero } from '../ui/page_hero';
import { useEffect, useState } from 'react';
import { createItem, listItems } from '../service/api';
import type { Item } from '../service/types';

export function LinksPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [url, setUrl] = useState('');

  useEffect(() => {
    listItems({ kind: 'link' }).then(setItems);
  }, []);

  async function add(): Promise<void> {
    if (!url.trim()) return;
    await createItem({ kind: 'link', title: url, content: url });
    setUrl('');
    setItems(await listItems({ kind: 'link' }));
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHero title="Links" subtitle="Save and revisit important URLs" tone="blue" />
      <div className="rounded-xl border border-slate-200 bg-white shadow-card p-3 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste URL" className="flex-1 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
        <button onClick={add} className="rounded-md bg-primary-600 text-white px-4 py-2 text-sm">Add</button>
      </div>
      {items.length === 0 ? (
        <EmptyCard text="No links yet. Use Quick Add or paste a URL here." />
      ) : (
        <ul className="space-y-2">
          {items.map((x) => (
            <li key={x.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-card text-sm">
              <a href={x.content || '#'} target="_blank" className="text-primary-700 underline break-all">{x.title}</a>
            </li>
          ))}
        </ul>
      )}
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

function EmptyCard({ text }: { text: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
      {text}
    </div>
  );
}



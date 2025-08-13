import { PageHeader } from '../ui/page_header';
import { useEffect, useState } from 'react';
import { createItem, listItems } from '../service/api';
import type { Item } from '../service/types';
import { FileText } from 'lucide-react';

export function NotesPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    listItems({ kind: 'note' }).then(setItems);
  }, []);

  async function add(): Promise<void> {
    if (!note.trim()) return;
    await createItem({ kind: 'note', title: note });
    setNote('');
    setItems(await listItems({ kind: 'note' }));
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 p-4">
      <PageHeader title="Notes" icon={<FileText className="w-6 h-6" />} />
      <div className="rounded-xl border border-slate-200 bg-white shadow-card p-3 flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a quick note" className="flex-1 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
        <button onClick={add} className="rounded-md bg-primary-600 text-white px-4 py-2 text-sm">Add</button>
      </div>
      {items.length === 0 ? (
        <EmptyCard text="Capture ideas quickly and organize later." />
      ) : (
        <ul className="space-y-2">
          {items.map((x) => (
            <li key={x.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-card text-sm">{x.title}</li>
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



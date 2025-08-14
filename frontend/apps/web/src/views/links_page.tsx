import { PageHeader } from '../ui/page_header';
import { useEffect, useState } from 'react';
import { createItem, listItems, updateItem, deleteItem } from '../service/api';
import type { Item } from '../service/types';
import { Link, Edit, Trash2, X, Check } from 'lucide-react';

export function LinksPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [url, setUrl] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    listItems({ kind: 'link' }).then(setItems);
  }, []);

  async function add(): Promise<void> {
    if (!url.trim()) return;
    await createItem({ kind: 'link', title: url, content: url });
    setUrl('');
    setItems(await listItems({ kind: 'link' }));
  }

  async function updateLink(item: Item): Promise<void> {
    if (!editText.trim()) return;
    await updateItem(item.id, { title: editText, content: editText });
    setEditingItem(null);
    setEditText('');
    setItems(await listItems({ kind: 'link' }));
  }

  async function deleteLink(itemId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this link?')) {
      await deleteItem(itemId);
      setItems(await listItems({ kind: 'link' }));
    }
  }

  function startEdit(item: Item): void {
    setEditingItem(item);
    setEditText(item.title);
  }

  function cancelEdit(): void {
    setEditingItem(null);
    setEditText('');
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 p-4">
      <PageHeader title="Links" icon={<Link className="w-6 h-6" />} />
      <div className="rounded-xl border border-slate-200 bg-white shadow-card p-3 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste URL" className="flex-1 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
        <button onClick={add} className="rounded-md bg-primary-600 text-white px-4 py-2 text-sm">Add</button>
      </div>
      {items.length === 0 ? (
        <EmptyCard text="No links yet. Use Quick Add or paste a URL here." />
      ) : (
        <ul className="space-y-2">
          {items.map((x) => (
            <li key={x.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
              {editingItem?.id === x.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    onKeyDown={(e) => e.key === 'Enter' && updateLink(x)}
                  />
                  <button onClick={() => updateLink(x)} className="p-2 text-green-600 hover:bg-green-50 rounded-md">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelEdit} className="p-2 text-gray-600 hover:bg-gray-50 rounded-md">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <a href={x.content || '#'} target="_blank" className="text-primary-700 underline break-all text-sm flex-1">
                    {x.title}
                  </a>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => startEdit(x)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteLink(x.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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



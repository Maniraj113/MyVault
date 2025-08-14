import { PageHeader } from '../ui/page_header';
import { useEffect, useState } from 'react';
import { createItem, listItems, updateItem, deleteItem } from '../service/api';
import type { Item } from '../service/types';
import { FileText, Edit, Trash2, X, Check } from 'lucide-react';

export function NotesPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    listItems({ kind: 'note' }).then(setItems);
  }, []);

  async function add(): Promise<void> {
    if (!note.trim()) return;
    await createItem({ kind: 'note', title: note });
    setNote('');
    setItems(await listItems({ kind: 'note' }));
  }

  async function updateNote(item: Item): Promise<void> {
    if (!editText.trim()) return;
    await updateItem(item.id, { title: editText });
    setEditingItem(null);
    setEditText('');
    setItems(await listItems({ kind: 'note' }));
  }

  async function deleteNote(itemId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteItem(itemId);
      setItems(await listItems({ kind: 'note' }));
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
            <li key={x.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
              {editingItem?.id === x.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    onKeyDown={(e) => e.key === 'Enter' && updateNote(x)}
                  />
                  <button onClick={() => updateNote(x)} className="p-2 text-green-600 hover:bg-green-50 rounded-md">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelEdit} className="p-2 text-gray-600 hover:bg-gray-50 rounded-md">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{x.title}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(x)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteNote(x.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
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



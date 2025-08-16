import { PageHeader } from '../ui/page_header';
import { useEffect, useState } from 'react';
import { createItem, listItems, updateItem, deleteItem } from '../service/api';
import type { Item } from '../service/types';
import { Palette, Edit, Trash2, X, Check, Plus, Search } from 'lucide-react';

export function NotesPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    listItems({ kind: 'note' }).then(setItems);
  }, []);

  async function add(): Promise<void> {
    if (!note.trim()) return;
    await createItem({ kind: 'note', title: note });
    setNote('');
    setIsExpanded(false);
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
    try {
      await deleteItem(itemId);
      setSuccess('Note deleted successfully!');
      setDeleteConfirmId(null);
      setItems(await listItems({ kind: 'note' }));
    } catch (error) {
      console.error('Failed to delete note:', error);
      setError('Failed to delete note. Please try again.');
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

  const filteredNotes = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0 p-4">
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{success}</span>
            <button 
              onClick={() => setSuccess(null)} 
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <PageHeader title="Notes" icon={<Palette className="w-6 h-6 text-yellow-600" />} />
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Note Input - Google Keep Style */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-4">
          {isExpanded && (
            <input
              placeholder="Title (optional)"
              className="w-full text-lg font-medium text-gray-900 border-none outline-none resize-none mb-3 placeholder-gray-400"
              disabled
            />
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Take a note..."
            className={`w-full border-none outline-none resize-none placeholder-gray-400 transition-all duration-200 ${
              isExpanded ? 'min-h-32 text-base' : 'min-h-12 text-sm'
            }`}
            rows={isExpanded ? 6 : 1}
          />
          
          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {/* Future: Add color picker, reminder, etc. */}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNote('');
                    setIsExpanded(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={add}
                  disabled={!note.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <EmptyCard text={searchTerm ? "No notes match your search." : "Capture ideas quickly and organize later."} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              {editingItem?.id === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full min-h-32 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Edit your note..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateNote(note)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-3 h-3 inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-3 h-3 inline mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div 
                    className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words cursor-text"
                    onClick={() => startEdit(note)}
                  >
                    {note.title}
                  </div>
                  
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit note"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(note.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Delete Confirmation */}
                  {deleteConfirmId === note.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800 mb-2">
                        Are you sure you want to delete this note?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyCard({ text }: { text: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      <Palette className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>{text}</p>
    </div>
  );
}



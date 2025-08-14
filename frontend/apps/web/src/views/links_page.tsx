import { PageHeader } from '../ui/page_header';
import { useEffect, useState } from 'react';
import { createItem, listItems, updateItem, deleteItem } from '../service/api';
import type { Item } from '../service/types';
import { Globe, Edit, Trash2, X, Check, Plus, ExternalLink, Search } from 'lucide-react';

export function LinksPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editText, setEditText] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    listItems({ kind: 'link' }).then(setItems);
  }, []);

  async function add(): Promise<void> {
    if (!url.trim()) return;
    
    const content = notes.trim() ? JSON.stringify({ url: url.trim(), notes: notes.trim() }) : url.trim();
    await createItem({ kind: 'link', title: url.trim(), content });
    setUrl('');
    setNotes('');
    setIsExpanded(false);
    setItems(await listItems({ kind: 'link' }));
  }

  async function updateLink(item: Item): Promise<void> {
    if (!editText.trim()) return;
    
    const content = editNotes.trim() ? JSON.stringify({ url: editText.trim(), notes: editNotes.trim() }) : editText.trim();
    await updateItem(item.id, { title: editText, content });
    setEditingItem(null);
    setEditText('');
    setEditNotes('');
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
    
    try {
      // Try to parse content as JSON to get notes
      if (item.content && item.content.startsWith('{')) {
        const parsed = JSON.parse(item.content);
        setEditNotes(parsed.notes || '');
        setEditText(parsed.url || item.title);
      } else {
        setEditNotes('');
        setEditText(item.title);
      }
    } catch {
      setEditNotes('');
      setEditText(item.title);
    }
  }

  function cancelEdit(): void {
    setEditingItem(null);
    setEditText('');
    setEditNotes('');
  }

  const getLinkData = (item: Item) => {
    try {
      if (item.content && item.content.startsWith('{')) {
        const parsed = JSON.parse(item.content);
        return { url: parsed.url || item.title, notes: parsed.notes || '' };
      }
      return { url: item.title, notes: '' };
    } catch {
      return { url: item.title, notes: '' };
    }
  };

  const filteredLinks = items.filter(item => {
    const linkData = getLinkData(item);
    const searchLower = searchTerm.toLowerCase();
    return linkData.url.toLowerCase().includes(searchLower) || 
           linkData.notes.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0 p-4">
      <PageHeader title="Links" icon={<Globe className="w-6 h-6 text-indigo-600" />} />
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search links and notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Link Input Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-4">
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Paste URL here..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {isExpanded && (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this link (optional)..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setUrl('');
                      setNotes('');
                      setIsExpanded(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={add}
                    disabled={!url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Links Grid */}
      {filteredLinks.length === 0 ? (
        <EmptyCard text={searchTerm ? "No links match your search." : "No links yet. Use Quick Add or paste a URL here."} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item) => {
            const linkData = getLinkData(item);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                {editingItem?.id === item.id ? (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter URL..."
                    />
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Add notes about this link..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateLink(item)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <a
                        href={linkData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all text-sm font-medium flex-1 mr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {linkData.url}
                      </a>
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                    
                    {linkData.notes && (
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                        {linkData.notes}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit link"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLink(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyCard({ text }: { text: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>{text}</p>
    </div>
  );
}



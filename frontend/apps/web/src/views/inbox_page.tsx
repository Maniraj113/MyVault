import { SectionGrid } from '../widgets/section_grid';
import { PageHeader } from '../ui/page_header';
import { useEffect, useMemo, useState } from 'react';
import { listItems } from '../service/api';
import type { Item } from '../service/types';
import { Home, MessageCircle, Wallet, Calendar, CheckSquare, Link as LinkIcon, StickyNote, FileImage, HeartPulse, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function InboxPage(): JSX.Element {
  const [recent, setRecent] = useState<Item[]>([]);

  useEffect(() => {
    listItems({ limit: 8 }).then(setRecent).catch(() => setRecent([]));
  }, []);

  const shortcuts = useMemo(() => ([
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/expenses', label: 'Expenses', icon: Wallet },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/links', label: 'Links', icon: LinkIcon },
    { to: '/notes', label: 'Notes', icon: StickyNote },
    { to: '/docs', label: 'Docs', icon: FileImage },
    { to: '/health', label: 'Health', icon: HeartPulse },
    { to: '/search', label: 'Search', icon: Search },
  ]), []);

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <PageHeader title="Home" icon={<Home className="w-8 h-8 text-blue-600" />} />

      {/* Quick Access */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {shortcuts.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="group rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Recently Added */}
      <div className="flex-1">
        <SectionGrid
          title="Recently Added"
          items={recent.map((x) => ({ title: x.title, tag: x.kind[0].toUpperCase() + x.kind.slice(1) }))}
        />
      </div>
    </div>
  );
}

// hero moved to shared PageHero



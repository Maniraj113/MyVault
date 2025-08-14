import { useMemo } from 'react';
import { Home, MessageCircle, Wallet, Calendar, CheckSquare, Link as LinkIcon, StickyNote, FileImage, HeartPulse, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function InboxPage(): JSX.Element {
  const shortcuts = useMemo(() => ([
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/recent', label: 'Recent', icon: Search },
    { to: '/expenses', label: 'Expenses', icon: Wallet },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/links', label: 'Links', icon: LinkIcon },
    { to: '/notes', label: 'Notes', icon: StickyNote },
    { to: '/docs', label: 'Documents', icon: FileImage },
  ]), []);

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Home className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Home</h1>
      </div>

      {/* Futuristic icon launcher */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="group relative rounded-2xl p-4 bg-gradient-to-br from-slate-50 to-white border hover:shadow-md transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="h-12 w-12 rounded-xl grid place-items-center bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm">
              <Icon className="w-6 h-6" />
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-800">{label}</div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}



import { useMemo } from 'react';
import { Home, MessageCircle, Wallet, Calendar, CheckSquare, Link as LinkIcon, StickyNote, FileImage, HeartPulse, Search, Sparkles, Zap, Target, Layers, Palette, Bot, Globe, Database } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function InboxPage(): JSX.Element {
  const shortcuts = useMemo(() => ([
    { to: '/chat', label: 'Chat', icon: MessageCircle, color: 'text-emerald-600' },
    { to: '/recent', label: 'Recent', icon: Sparkles, color: 'text-blue-600' },
    { to: '/expenses', label: 'Expenses', icon: Wallet, color: 'text-emerald-600' },
    { to: '/calendar', label: 'Calendar', icon: Calendar, color: 'text-red-600' },
    { to: '/tasks', label: 'Tasks', icon: Target, color: 'text-orange-600' },
    { to: '/links', label: 'Links', icon: Globe, color: 'text-indigo-600' },
    { to: '/notes', label: 'Notes', icon: Palette, color: 'text-yellow-600' },
    { to: '/docs', label: 'Documents', icon: Database, color: 'text-purple-600' },
  ]), []);

  return (
    <div className="h-full flex flex-col p-4 space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3">
        <Home className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Home</h1>
      </div>

      {/* Futuristic icon launcher - Responsive sizing */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
        {shortcuts.map(({ to, label, icon: Icon, color }) => (
          <NavLink key={to} to={to} className="group relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 to-white border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl grid place-items-center bg-transparent group-hover:bg-gradient-to-br group-hover:from-slate-50 group-hover:to-white transition-all duration-300">
              <Icon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${color} group-hover:scale-110 transition-transform duration-300`} />
            </div>
            <div className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg font-semibold text-gray-800 group-hover:text-gray-900 transition-colors text-center">{label}</div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}



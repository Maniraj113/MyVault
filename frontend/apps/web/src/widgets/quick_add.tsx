import { Link as LinkIcon, StickyNote, FileImage, Wallet, CheckSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type QuickItem = { to: string; label: string; icon: JSX.Element; color: string };

const items: QuickItem[] = [
  { to: '/links', label: 'Link', icon: <LinkIcon className="h-5 w-5" />, color: 'bg-blue-50 text-blue-700' },
  { to: '/notes', label: 'Note', icon: <StickyNote className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-700' },
  { to: '/docs', label: 'Doc', icon: <FileImage className="h-5 w-5" />, color: 'bg-cyan-50 text-cyan-700' },
  { to: '/expenses', label: 'Expense', icon: <Wallet className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
  { to: '/tasks', label: 'Task', icon: <CheckSquare className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
];

export function QuickAdd(): JSX.Element {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {items.map((item) => (
        <NavLink
          to={item.to}
          key={item.label}
          className={`group rounded-xl p-3 ${item.color} shadow-sm hover:shadow transition-shadow`}
          aria-label={`Add ${item.label}`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/70 text-inherit">
              {item.icon}
            </div>
            <div className="text-xs font-medium">{item.label}</div>
          </div>
        </NavLink>
      ))}
    </div>
  );
}



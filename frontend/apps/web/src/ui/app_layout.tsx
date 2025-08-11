import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from './cn';
import { useMemo, useState, useEffect } from 'react';
import React from 'react';
import { ALL_ITEMS, NavItem } from './nav_items';
import VaultIcon from '../assets/Vault Image.png';
import { listItems } from '../service/api';

export function AppLayout(): JSX.Element {
  const location = useLocation();

  const [primaryItems, secondaryItems] = useMemo(() => {
    const sorted = [...ALL_ITEMS].sort((a, b) => a.priority - b.priority);
    return [sorted.slice(0, 5), sorted.slice(5)];
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-gray-50 lg:text-slate-900 lg:fixed lg:h-full lg:left-0 lg:top-0 lg:pt-20 border-r border-slate-200">
          <div className="flex-1 overflow-y-auto py-6">
            <NavGroup items={[...primaryItems, ...secondaryItems]} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 overflow-auto pb-16 lg:pb-0 bg-gray-50">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav for mobile with More sheet */}
      <MobileNav primaryItems={primaryItems} secondaryItems={secondaryItems} />
    </div>
  );
}

function TopBar(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentOpen, setRecentOpen] = useState(false);
  const [recent, setRecent] = useState<{ title: string; kind: string }[]>([]);

  useEffect(() => {
    if (!recentOpen) return;
    listItems({ limit: 6 }).then((items: any[]) => {
      setRecent(items.map(x => ({ title: x.title, kind: x.kind })));
    }).catch(() => setRecent([]));
  }, [recentOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-900 text-white">
      <div className="w-full px-4 py-3 lg:py-4">
        <div className="flex items-center justify-between gap-4 max-w-none relative">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src={VaultIcon} alt="MyVault" className="h-10 w-10 rounded-lg shadow-md ring-1 ring-white/20" />
            <div className="text-2xl font-bold tracking-tight">MyVault</div>
          </div>
          
          {/* Center - Search bar (desktop only) */}
          <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <input
                type="search"
                placeholder="Search expenses, tasks, chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 px-3 py-2 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
              />
            </form>
          </div>
          
          {/* Right side - User info + Recent button */}
          <div className="flex items-center gap-3 text-white/90 flex-shrink-0 relative">
            <button
              onClick={() => setRecentOpen(v => !v)}
              className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Recent"
              title="Recently Added"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9"/><polyline points="21 3 21 12 12 12"/>
              </svg>
              <span className="text-sm">Recent</span>
            </button>
            <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center font-medium">M</div>

            {recentOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold bg-gray-50 border-b">Recently Added</div>
                <ul className="max-h-80 overflow-y-auto">
                  {recent.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-gray-500">No recent items</li>
                  ) : (
                    recent.map((r, idx) => (
                      <li key={idx} className="px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-700 text-[10px] uppercase">{r.kind[0]}</span>
                        <span className="truncate">{r.title}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavGroup({ items }: { items: NavItem[] }): JSX.Element {
  return (
    <div className="px-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors border-l-4',
                  isActive
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              {item.icon({ className: 'h-6 w-6' })}
              <span className="text-base">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileNav({
  primaryItems,
  secondaryItems,
}: {
  primaryItems: NavItem[];
  secondaryItems: NavItem[];
}): JSX.Element {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const firstFour = primaryItems.slice(0, 4);
  return (
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <ul className="flex items-center justify-around py-2 safe-area-inset-bottom">
        {firstFour.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                  isActive || (location.pathname === '/' && item.to === '/chat')
                    ? 'text-blue-600'
                    : 'text-gray-500'
                )
              }
              aria-label={item.label}
            >
              {item.icon({ className: 'h-6 w-6' })}
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
        <li>
          <button
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-gray-500 transition-colors"
            onClick={() => setIsMoreOpen((v) => !v)}
            aria-label="More"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
            <span className="text-xs font-medium">More</span>
          </button>
        </li>
      </ul>

      {isMoreOpen && (
        <div className="absolute inset-x-0 bottom-16 mx-4 rounded-xl border border-gray-200 bg-white shadow-lg p-3">
          <ul className="grid grid-cols-3 gap-3">
            {[...primaryItems.slice(4), ...secondaryItems].map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-2 rounded-lg px-3 py-3 text-xs hover:bg-gray-50 transition-colors',
                      isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                    )
                  }
                >
                  {item.icon({ className: 'h-6 w-6' })}
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}



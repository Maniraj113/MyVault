import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from './cn';
import { useMemo, useState } from 'react';
import { ALL_ITEMS, NavItem } from './nav_items';

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
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-gray-900 lg:text-white lg:fixed lg:h-full lg:left-0 lg:top-0 lg:pt-20">
          <div className="flex-1 overflow-y-auto py-6">
            <NavGroup items={[...primaryItems, ...secondaryItems]} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 overflow-auto pb-16 lg:pb-0">
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
  return (
    <header className="sticky top-0 z-40 border-b border-primary-600/20 bg-gradient-to-r from-primary-700 to-primary-500 text-white shadow-sm">
      <div className="mx-auto max-w-[1400px] px-4 py-3 lg:py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-2xl font-bold text-white tracking-tight">MyVault</div>
        </div>
        <div className="hidden md:block w-full max-w-md">
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg border border-white/25 bg-white/15 text-white placeholder-white/80 px-3 py-2 outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="flex items-center gap-3 text-white">
          <div className="hidden sm:block">Maniraj</div>
          <div className="h-9 w-9 rounded-full bg-white/25 grid place-items-center">M</div>
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
                    ? 'bg-gray-800 border-blue-500 text-white' 
                    : 'border-transparent text-gray-300 hover:bg-gray-800 hover:text-white'
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



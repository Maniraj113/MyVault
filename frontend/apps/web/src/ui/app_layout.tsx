import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from './cn';
import { useMemo, useState } from 'react';
import React from 'react';
import { ALL_ITEMS, NavItem } from './nav_items';
import VaultIcon from '../assets/Vault Image.png';
import FamilyPic from '../assets/Family_Pic.jpg';


export function AppLayout(): JSX.Element {
  const location = useLocation();

  const [primaryItems, sidebarItems] = useMemo(() => {
    const sorted = [...ALL_ITEMS].sort((a, b) => a.priority - b.priority);
    return [sorted.slice(0, 5), sorted]; // 5 for mobile, all for desktop sidebar
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:bg-gray-50 lg:text-slate-900 lg:fixed lg:h-full lg:left-0 lg:top-0 lg:pt-20 border-r border-slate-200">
          <div className="flex-1 overflow-y-auto py-6">
            <NavGroup items={sidebarItems} />
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
      <MobileNav primaryItems={primaryItems} />
    </div>
  );
}

function TopBar(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  // Recent popover removed; use dedicated /recent screen

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleLogoClick = () => {
    navigate('/inbox'); // Navigate to home screen
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-lg">
      <div className="w-full px-4 py-3 lg:py-4">
        <div className="flex items-center justify-between gap-4 max-w-none relative">
          {/* Left side - Logo and Title */}
          <div 
            className="flex items-center gap-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <img src={VaultIcon} alt="MyVault" className="h-10 w-10 rounded-lg shadow-lg ring-2 ring-white/30 object-contain" />
            <div className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">MyVault</div>
          </div>
          
          {/* Center - Search bar (desktop only) */}
          <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <input
                type="search"
                placeholder="Search expenses, tasks, chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-0 bg-white/20 text-white placeholder-white/70 px-4 py-2.5 outline-none focus:bg-white/30 focus:ring-2 focus:ring-white/40 backdrop-blur-sm transition-all duration-200"
              />
            </form>
          </div>
          
          {/* Right side - User info */}
          <div className="flex items-center gap-3 text-white/90 flex-shrink-0 relative">
            <img src={FamilyPic} alt="User" className="h-10 w-10 rounded-full ring-2 ring-white/30 shadow-lg object-cover object-center" />
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
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <div className="flex-shrink-0">
                {item.icon({ className: 'h-6 w-6' })}
              </div>
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
}: {
  primaryItems: NavItem[];
}): JSX.Element {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <ul className="flex items-center justify-around py-2 safe-area-inset-bottom">
        {primaryItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                  isActive || (location.pathname === '/' && item.to === '/chat')
                    ? 'text-emerald-600'
                    : 'text-gray-500'
                )
              }
              aria-label={item.label}
            >
              <div className="flex-shrink-0">
                {item.icon({ className: 'h-6 w-6' })}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}



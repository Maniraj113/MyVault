import {
  MessageCircle,
  Home,
  Globe,
  Palette,
  Database,
  Wallet,
  Target,
  Sparkles,
  HeartPulse,
  Calendar
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  priority: number; // lower = more important for bottom bar
};

// Navigation items for desktop sidebar and mobile bottom nav
export const ALL_ITEMS: NavItem[] = [
  { 
    to: '/inbox', 
    label: 'Home', 
    icon: (p) => <Home className={`${p.className} text-blue-600`} />, 
    priority: 1 
  },
  { 
    to: '/chat', 
    label: 'Chat', 
    icon: (p) => <MessageCircle className={`${p.className} text-emerald-600`} />, 
    priority: 2 
  },
  { 
    to: '/expenses', 
    label: 'Expenses', 
    icon: (p) => <Wallet className={`${p.className} text-emerald-600`} />, 
    priority: 3 
  },
  { 
    to: '/docs', 
    label: 'Documents', 
    icon: (p) => <Database className={`${p.className} text-purple-600`} />, 
    priority: 4 
  },
  { 
    to: '/notes', 
    label: 'Notes', 
    icon: (p) => <Palette className={`${p.className} text-yellow-600`} />, 
    priority: 5 
  },
  { 
    to: '/tasks', 
    label: 'Tasks', 
    icon: (p) => <Target className={`${p.className} text-orange-600`} />, 
    priority: 6 
  },
  { 
    to: '/calendar', 
    label: 'Calendar', 
    icon: (p) => <Calendar className={`${p.className} text-red-600`} />, 
    priority: 7 
  },
  { 
    to: '/links', 
    label: 'Links', 
    icon: (p) => <Globe className={`${p.className} text-indigo-600`} />, 
    priority: 8 
  },
];



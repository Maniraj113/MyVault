import {
  MessageCircle,
  Home,
  Link as LinkIcon,
  StickyNote,
  FileImage,
  Wallet,
  CheckSquare,
  Search,
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
  { to: '/chat', label: 'Chat', icon: (p) => <MessageCircle className={p.className} />, priority: 1 },
  { to: '/inbox', label: 'Home', icon: (p) => <Home className={p.className} />, priority: 2 },
  { to: '/expenses', label: 'Expenses', icon: (p) => <Wallet className={p.className} />, priority: 3 },
  { to: '/notes', label: 'Notes', icon: (p) => <StickyNote className={p.className} />, priority: 4 },
  { to: '/links', label: 'Links', icon: (p) => <LinkIcon className={p.className} />, priority: 5 },
  { to: '/tasks', label: 'Tasks', icon: (p) => <CheckSquare className={p.className} />, priority: 6 },
  { to: '/calendar', label: 'Calendar', icon: (p) => <Calendar className={p.className} />, priority: 7 },
  { to: '/docs', label: 'Documents', icon: (p) => <FileImage className={p.className} />, priority: 8 },
];



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

// Only the required five in the specified order
export const ALL_ITEMS: NavItem[] = [
  { to: '/chat', label: 'Chat', icon: (p) => <MessageCircle className={p.className} />, priority: 1 },
  { to: '/inbox', label: 'Home', icon: (p) => <Home className={p.className} />, priority: 2 },
  { to: '/expenses', label: 'Expenses', icon: (p) => <Wallet className={p.className} />, priority: 3 },
  { to: '/calendar', label: 'Calendar', icon: (p) => <Calendar className={p.className} />, priority: 4 },
  { to: '/docs', label: 'Documents', icon: (p) => <FileImage className={p.className} />, priority: 5 },
];



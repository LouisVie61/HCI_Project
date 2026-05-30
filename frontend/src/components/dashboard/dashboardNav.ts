import {
  BookOpenCheck,
  Bot,
  Camera,
  Languages,
  LayoutDashboard,
  Library,
  Trophy,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export interface DashboardNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const dashboardNavItems: DashboardNavItem[] = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Lessons', path: '/dashboard/lessons', icon: BookOpenCheck },
  { label: 'Flashcard', path: '/dashboard/flashcards', icon: Trophy },
  { label: 'ASL Dictionary', path: '/dashboard/dictionary', icon: Library },
  { label: 'Sign to Text', path: '/dashboard/recognition', icon: Camera },
  { label: 'Text to Sign', path: '/dashboard/translate', icon: Languages },
  { label: 'Chat AI', path: '/dashboard/chat', icon: Bot },
  { label: 'Profile', path: '/dashboard/profile', icon: UserCircle },
];

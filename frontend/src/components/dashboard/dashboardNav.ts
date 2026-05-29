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
  { label: 'Tong quan', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Bai hoc', path: '/dashboard/lessons', icon: BookOpenCheck },
  { label: 'Flashcard', path: '/dashboard/flashcards', icon: Trophy },
  { label: 'ASL Dictionary', path: '/dashboard/dictionary', icon: Library },
  { label: 'Dich ngon ngu ky hieu', path: '/dashboard/recognition', icon: Camera },
  { label: 'Dich van ban', path: '/dashboard/translate', icon: Languages },
  { label: 'Chat AI', path: '/dashboard/chat', icon: Bot },
  { label: 'Ho so', path: '/dashboard/profile', icon: UserCircle },
];

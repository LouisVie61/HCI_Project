import {
  BookOpenCheck,
  Bot,
  Camera,
  Languages,
  LayoutDashboard,
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
  { label: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Bài học', path: '/dashboard/lessons', icon: BookOpenCheck },
  { label: 'Flashcard', path: '/dashboard/flashcards', icon: Trophy },
  { label: 'Nhận diện', path: '/dashboard/recognition', icon: Camera },
  { label: 'Dịch text', path: '/dashboard/translate', icon: Languages },
  { label: 'Chat AI', path: '/dashboard/chat', icon: Bot },
  { label: 'Hồ sơ', path: '/dashboard/profile', icon: UserCircle },
];

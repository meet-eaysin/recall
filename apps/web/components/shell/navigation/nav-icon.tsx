import type { IconName } from '@/components/icon';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Atom,
  BarChart3,
  BookOpen,
  Blocks,
  CalendarCheck2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  CreditCard,
  Ellipsis,
  ExternalLink,
  FileText,
  Folder,
  Gift,
  GitBranch,
  Grid3X3,
  Laptop,
  Library,
  Link2,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tags,
  Terminal,
  Users,
  Waypoints,
  Webhook,
  Zap,
} from 'lucide-react';

const navIconMap: Partial<
  Record<IconName, ComponentType<{ className?: string }>>
> = {
  'arrow-right': ArrowRight,
  atom: Atom,
  'book-open': BookOpen,
  'chart-bar': BarChart3,
  'chart-line': BarChart3,
  blocks: Blocks,
  'calendar-check-2': CalendarCheck2,
  calendar: CalendarDays,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  clock: Clock3,
  'credit-card': CreditCard,
  ellipsis: Ellipsis,
  'external-link': ExternalLink,
  'file-text': FileText,
  folder: Folder,
  gift: Gift,
  'grid-3x3': Grid3X3,
  laptop: Laptop,
  library: Library,
  link: Link2,
  'link-2': Link2,
  'layout-dashboard': LayoutDashboard,
  plus: Plus,
  'rotate-cw': RefreshCw,
  search: Search,
  settings: Settings,
  split: GitBranch,
  tags: Tags,
  terminal: Terminal,
  users: Users,
  waypoints: Waypoints,
  webhook: Webhook,
  zap: Zap,
};

export function NavIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const IconComponent = navIconMap[name] ?? Circle;
  return <IconComponent aria-hidden className={cn('shrink-0', className)} />;
}

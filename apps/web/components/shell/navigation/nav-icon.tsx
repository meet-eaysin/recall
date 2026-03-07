import type { IconName } from '@/components/icon';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Atom,
  BarChart3,
  Blocks,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  CreditCard,
  Ellipsis,
  ExternalLink,
  Gift,
  GitBranch,
  Grid3X3,
  Link2,
  LayoutDashboard,
  RefreshCw,
  Search,
  Settings,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';

const navIconMap: Partial<Record<IconName, ComponentType<{ className?: string }>>> = {
  'arrow-right': ArrowRight,
  atom: Atom,
  'chart-bar': BarChart3,
  blocks: Blocks,
  calendar: CalendarDays,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  clock: Clock3,
  'credit-card': CreditCard,
  ellipsis: Ellipsis,
  'external-link': ExternalLink,
  gift: Gift,
  'grid-3x3': Grid3X3,
  link: Link2,
  'link-2': Link2,
  'layout-dashboard': LayoutDashboard,
  'rotate-cw': RefreshCw,
  search: Search,
  settings: Settings,
  split: GitBranch,
  terminal: Terminal,
  users: Users,
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

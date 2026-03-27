import type React from 'react';
import { RotateCcwSquare, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const LogoIcon = (props: LucideProps) => (
  <RotateCcwSquare {...props} className={cn('text-primary', props.className)} />
);

export const Logo = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex items-center gap-2.5', className)} {...props}>
    <RotateCcwSquare className="size-6 text-primary shrink-0" />
    <span className="font-heading font-bold text-xl tracking-tight whitespace-nowrap">
      Recall
    </span>
    <Badge
      variant="outline"
      size="sm"
      className="h-5 rounded-full border-primary/20 bg-primary/8 px-2 text-[9px] font-semibold tracking-[0.16em] text-primary"
    >
      Beta
    </Badge>
  </div>
);

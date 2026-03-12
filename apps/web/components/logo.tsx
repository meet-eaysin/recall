import type React from 'react';
import { BrainIcon, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LogoIcon = (props: LucideProps) => (
  <BrainIcon {...props} className={cn('text-primary', props.className)} />
);

export const Logo = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex items-center gap-2', className)} {...props}>
    <BrainIcon className="size-6 text-primary shrink-0" />
    <span className="font-heading font-bold text-xl tracking-tight whitespace-nowrap">
      dev.me
    </span>
  </div>
);

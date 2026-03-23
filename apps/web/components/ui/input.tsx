import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      size: {
        default: 'h-8 px-2.5 py-1',
        sm: 'h-7 px-2 py-0.5 text-sm',
        lg: 'h-9 px-3 py-1.5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    Omit<VariantProps<typeof inputVariants>, 'size'> {
  nativeInput?: boolean;
  size?: 'sm' | 'default' | 'lg' | number;
}

function Input({
  className,
  type,
  size = 'default',
  nativeInput: _nativeInput,
  ...props
}: InputProps) {
  const isStringSize = typeof size === 'string';

  return (
    <input
      type={type}
      size={!isStringSize ? (size as number) : undefined}
      data-slot="input"
      data-size={isStringSize ? size : undefined}
      className={cn(
        inputVariants({ size: isStringSize ? size : 'default', className }),
      )}
      {...props}
    />
  );
}

export { Input, inputVariants };

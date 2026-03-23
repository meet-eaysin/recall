import { cn } from '@/lib/utils';
import { DecorIcon } from '@/components/ui/decor-icon';
import { FullWidthDivider } from '@/components/ui/full-width-divider';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';

export function HeroSection() {
  return (
    <section id="top">
      <div className="relative flex flex-col items-center justify-center gap-5 px-4 py-12 md:px-4 md:py-24 lg:py-28">
        {/* X Faded Borders & Shades */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-1 size-full overflow-hidden"
        >
          <div
            className={cn(
              'absolute -inset-x-20 inset-y-0 z-0 rounded-full',
              'bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.1),transparent,transparent)]',
              'blur-[50px]',
            )}
          />
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
        </div>
        <a
          className={cn(
            'group mx-auto flex w-fit items-center gap-3 rounded-sm border bg-card p-1 shadow transition-colors duration-200',
          )}
          href="#features"
        >
          <div className="rounded-xs border bg-card px-1.5 py-0.5 shadow-sm">
            <p className="font-mono text-xs">NEW</p>
          </div>

          <span className="text-xs">
            Your personal knowledge engine — Recall
          </span>
          <span className="block h-5 border-l" />

          <div className="pr-1">
            <ArrowRightIcon className="size-3 -translate-x-0.5 duration-150 ease-out group-hover:translate-x-0.5" />
          </div>
        </a>

        <h1
          className={cn(
            'max-w-3xl text-balance text-center text-5xl font-semibold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl',
          )}
        >
          Your mind, <br /> synchronized.
        </h1>

        <p
          className={cn(
            'mx-auto max-w-2xl text-balance text-center text-lg text-muted-foreground sm:text-xl',
          )}
        >
          The knowledge stack for deep researchers. MindStack unifies your links, PDFs, and notes into a semantic graph that grows with you.
        </p>

        <div className="flex w-fit items-center justify-center gap-3 pt-2">
          <Button asChild variant="outline">
            <a href="/auth/login">Sign In</a>
          </Button>
          <Button asChild>
            <a href="/app">
              Get Started <ArrowRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>
      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}

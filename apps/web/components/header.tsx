'use client';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useScroll } from '@/hooks/use-scroll';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { LayersIcon, LayoutDashboardIcon } from 'lucide-react';

export const navLinks = [
  {
    label: 'Features',
    href: '#features',
    icon: <LayersIcon className="size-4" />,
  },
];

export function Header() {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 mx-auto w-full max-w-6xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out',
        {
          'border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-3xl md:shadow':
            scrolled,
        },
      )}
    >
      <nav
        className={cn(
          'flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out',
          {
            'md:px-2': scrolled,
          },
        )}
      >
        <a
          className="rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50"
          href="#top"
        >
          <Logo className="h-4" />
        </a>
        <div className="hidden items-center gap-2 md:flex">
          <div>
            {navLinks.map((link) => (
              <Button
                key={link.label}
                size="sm"
                variant="ghost"
                render={<a href={link.href} />}
              >
                {link.icon && <span className="mr-2">{link.icon}</span>}
                {link.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" render={<a href="/auth/login" />}>
            Sign In
          </Button>
          <Button size="sm" render={<a href="/app" />}>
            <LayoutDashboardIcon data-icon="inline-start" /> Open App
          </Button>
        </div>
        <MobileNav />
      </nav>
    </header>
  );
}

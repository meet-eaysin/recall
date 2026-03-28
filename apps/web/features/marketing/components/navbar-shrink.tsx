'use client';
import { Menu, RotateCcwSquare, X } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthSession } from '@/features/auth/hooks';
import SignInButton from './signIn-butoon';
import AnchorNav from './anchor-nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '#features' },
];

const Navbar = () => {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { status } = useAuthSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && 'active'}
        className="group fixed z-50 w-full px-2"
      >
        <div
          className={cn(
            'mx-auto mt-2 max-w-380 border border-neutral-800/5 px-6 transition-all duration-300 lg:px-12',
            isScrolled &&
              'max-w-7xl rounded-2xl border border-neutral-800/50 bg-neutral-900/50 backdrop-blur-lg lg:px-5',
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-1 lg:gap-0">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" className="flex items-center gap-2">
                <RotateCcwSquare />
                <h3 className="text-xl font-bold text-white">Recall</h3>
                <Badge
                  variant="outline"
                  size="sm"
                  className="h-5 border-white/20 bg-white/8 px-2 text-[9px] font-semibold text-white/85 backdrop-blur-sm"
                >
                  Beta
                </Badge>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 text-white lg:hidden"
              >
                <Menu className="m-auto size-6 duration-200 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {navItems.map((item) => (
                  <AnchorNav
                    key={item.name + item.href}
                    absolute
                    href={item.href}
                  >
                    {item.name}
                  </AnchorNav>
                ))}
              </ul>
            </div>

            <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-none shadow-zinc-300/20 group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {navItems.map((item) => (
                    <AnchorNav
                      key={item.name + item.href}
                      absolute
                      href={item.href}
                    >
                      {item.name}
                    </AnchorNav>
                  ))}
                  {status === 'authenticated' && (
                    <li className="pt-2">
                      <Button>
                        <Link
                          href="/app"
                          className="text-emphasis font-medium transition-colors hover:text-white"
                          onClick={() => setMenuState(false)}
                        >
                          Go App
                        </Link>
                      </Button>
                    </li>
                  )}
                </ul>
              </div>
              <div
                className={cn(
                  'flex flex-col items-center space-y-3 sm:flex-row sm:gap-6 sm:space-y-0 md:w-fit w-full',
                )}
              >
                {status === 'authenticated' ? (
                  <div className="flex items-center gap-6">
                    <Button>
                      <Link
                        href="/app"
                        className="hidden text-sm font-medium transition-colors sm:block"
                      >
                        Go App
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <SignInButton text={'Sign Up'} />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

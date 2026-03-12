import { Library } from 'lucide-react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

const Hero = () => {
  return (
    <section className="relative isolate min-h-svh overflow-hidden border-b border-subtle">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-8">
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <Library className="h-5 w-5" />
            <span className="tracking-wide">
              <span className="font-semibold">Dev</span> Me
            </span>
          </Link>

          <div className="hidden items-center md:flex">
            <NavigationMenu align="start" className="justify-start">
              <NavigationMenuList className="gap-2">
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[460px] gap-2 p-3 md:grid-cols-2">
                      <NavigationMenuLink>
                        <Link href="/app" className="rounded-md p-3 transition hover:bg-muted">
                          <div className="text-sm font-semibold text-foreground">Overview</div>
                          <p className="text-xs text-muted-foreground">
                            Jump into the product workspace.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink>
                        <Link href="/app/library" className="rounded-md p-3 transition hover:bg-muted">
                          <div className="text-sm font-semibold text-foreground">Templates</div>
                          <p className="text-xs text-muted-foreground">
                            Curated starter kits for teams.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink>
                        <Link href="/app/graph" className="rounded-md p-3 transition hover:bg-muted">
                          <div className="text-sm font-semibold text-foreground">Graph</div>
                          <p className="text-xs text-muted-foreground">
                            See how your knowledge connects.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink>
                        <Link href="/app/search" className="rounded-md p-3 transition hover:bg-muted">
                          <div className="text-sm font-semibold text-foreground">Search</div>
                          <p className="text-xs text-muted-foreground">
                            Find the right context fast.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Why Dev Me</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[420px] gap-2 p-3">
                      <NavigationMenuLink>
                        <Link href="/how-it-works" className="rounded-md p-3 transition hover:bg-muted">
                          <div className="text-sm font-semibold text-foreground">How it works</div>
                          <p className="text-xs text-muted-foreground">
                            Understand the workflow in two minutes.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink>
                        <Link href="/app/analytics" className="rounded-md p-3 transition hover:bg-muted">
                          <div className="text-sm font-semibold text-foreground">Analytics</div>
                          <p className="text-xs text-muted-foreground">
                            Track momentum and knowledge reuse.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink>
                        <Link href="/app/settings" className="rounded-md p-3 transition hover:bg-muted">
                          <div className="text-sm font-semibold text-foreground">Security</div>
                          <p className="text-xs text-muted-foreground">
                            Control access and preferences.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Link href="/auth/login">Sign in</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Open app
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </div>

      <div className="relative z-10 mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center px-6 py-10 text-center md:py-16">
        <div className="mb-8 flex items-center gap-2">
          <Library />
          <span className="text-sm font-normal tracking-wide">
            <span className="font-semibold">Dev</span> Me
          </span>
        </div>

        <h1
          className="mb-10 text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.05] tracking-tight"
          style={{ fontFamily: "'Google Sans Display', 'DM Sans', sans-serif" }}
        >
          Capture And Retrieve<br />
         Your Knowledge Source.
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/download"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background shadow-sm transition hover:opacity-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1 4.7-2.6 6.2l-.4.4V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.4l-.4-.4A9 9 0 0 1 5 9a7 7 0 0 1 7-7zm-1.5 14h3v2h-3v-2zm1.5-3a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
            </svg>
            Get Started
          </Link>

          <Link
            href="/use-cases"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
            
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;

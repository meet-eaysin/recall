import Link from 'next/link';
import { ArrowRight, Sparkles, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';

const Hero = () => {
  return (
    <section className="relative min-h-svh overflow-hidden border-b border-subtle">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-112 w-md rounded-full bg-[radial-gradient(circle,rgba(52,83,92,0.38),transparent_70%)]" />
        <div className="absolute right-0 top-16 h-128 w-lg rounded-full bg-[radial-gradient(circle,rgba(120,86,45,0.34),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,rgba(10,11,12,0.18),transparent)]" />
      </div>

      <div className="mx-auto flex min-h-svh max-w-7xl items-center px-6 py-10 md:py-16">
        <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="w-fit">
              Knowledge infrastructure for modern teams
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your knowledge, organized and explainable.
            </h1>
            <p className="text-subtle text-base leading-relaxed sm:text-lg">
              Mind Stack turns scattered links, notes, and files into a living
              knowledge graph—so you can find answers fast and trust every
              source.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button render={<Link href="/auth/login" />}>
                Get started
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" render={<Link href="/app" />}>
                View workspace
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="size-3.5" />
                  Live preview
                </div>
                <Badge variant="outline">Live</Badge>
              </div>
              <CardTitle>Today’s Knowledge Pulse</CardTitle>
              <CardDescription>
                Surface what matters, with context and citations.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-3">
              <div className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserRound className="size-3.5" />
                  Research workspace • GMT+6
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1 text-[10px] text-muted-foreground">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                    <span key={d} className="text-center">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span
                      key={i}
                      className="flex h-6 items-center justify-center rounded-md border border-border/40"
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Due for review
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    7 documents
                  </p>
                </div>
                <Badge variant="outline">Today</Badge>
              </div>
              <Button
                className="w-full"
                variant="outline"
                render={<Link href="/app" />}
              >
                Open workspace
              </Button>
            </CardPanel>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import Link from 'next/link';
import { ArrowRight, Sparkles, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';
import { BackgroundPaths } from './background-paths';

const Hero = () => {
  return (
    <section className="relative isolate min-h-svh overflow-hidden border-b border-subtle bg-[#07090d]">
      <BackgroundPaths className="z-0" />

      <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl items-center px-6 py-10 md:py-16">
        <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="w-fit">
              Mind Stack • Knowledge graph platform
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Build a living knowledge graph your team can trust.
            </h1>
            <p className="text-subtle text-base leading-relaxed sm:text-lg">
              Capture sources, map relationships, and ask AI with citations. Turn
              scattered research into a connected, searchable system of record.
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
            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
              <span>Deploy in minutes</span>
              <span>Private by default</span>
              <span>Built for teams</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(105,160,190,0.2),transparent_70%)]" />
            <div className="absolute -inset-6 -z-10 rounded-3xl border border-white/5" />
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="size-3.5" />
                    Knowledge graph
                  </div>
                  <Badge variant="outline">Live</Badge>
                </div>
                <CardTitle>Research topology</CardTitle>
                <CardDescription>
                  Nodes, citations, and relationships mapped in real time.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Connections this week</span>
                    <span className="text-foreground">+18%</span>
                  </div>
                  <div className="mt-4">
                    <svg viewBox="0 0 320 180" className="h-40 w-full text-[rgba(140,190,215,0.65)]">
                      <defs>
                        <linearGradient id="graphLine" x1="0" x2="1" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgba(120,180,205,0.2)" />
                          <stop offset="100%" stopColor="rgba(140,210,235,0.7)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M30 130L90 90L150 115L210 70L280 100"
                        stroke="url(#graphLine)"
                        strokeWidth="3"
                        fill="none"
                      />
                      {[
                        [30, 130],
                        [90, 90],
                        [150, 115],
                        [210, 70],
                        [280, 100],
                      ].map(([cx, cy]) => (
                        <circle
                          key={`${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r="6"
                          fill="currentColor"
                          opacity="0.85"
                        />
                      ))}
                    </svg>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link2 className="size-3.5 text-foreground" />
                      Connected sources
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      142
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="size-3.5 text-foreground" />
                      Answer precision
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      98%
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  render={<Link href="/app" />}
                >
                  Explore the graph
                </Button>
              </CardPanel>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

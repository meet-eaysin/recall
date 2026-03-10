'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCheck,
  FileText,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';

const features = [
  {
    title: 'Capture and connect',
    description:
      'Save documents, links, and notes, then watch relationships emerge.',
    icon: FileText,
  },
  {
    title: 'AI answers with sources',
    description:
      'Ask the assistant and get citations tied to your original material.',
    icon: Bot,
  },
  {
    title: 'Graph intelligence',
    description:
      'Surface hidden paths between people, projects, and themes.',
    icon: BrainCircuit,
  },
  {
    title: 'Fast retrieval',
    description:
      'Search built for recall and speed so you never lose an insight.',
    icon: Search,
  },
  {
    title: 'Session control',
    description:
      'Cookie-based auth with revocation keeps access tight.',
    icon: ShieldCheck,
  },
  {
    title: 'Scales gracefully',
    description: 'From solo research to team knowledge ops.',
    icon: Layers,
  },
];

const workflow = [
  {
    title: 'Ingest',
    description: 'Drop in articles, PDFs, meeting notes, or docs.',
    icon: FileText,
  },
  {
    title: 'Enrich',
    description: 'Summaries, transcripts, and tags powered by AI.',
    icon: Sparkles,
  },
  {
    title: 'Retrieve',
    description: 'Ask questions and jump straight into the source.',
    icon: Search,
  },
];

export function LandingPage() {
  return (
    <main className="bg-default min-h-screen">
      <section className="relative overflow-hidden border-b border-subtle">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(52,83,92,0.35),transparent_70%)]" />
          <div className="absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(120,86,45,0.32),transparent_70%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(10,11,12,0.12),transparent)]" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="max-w-xl space-y-6">
              <Badge variant="outline" className="w-fit">
                Premium knowledge workflow
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Build a living knowledge stack your team can trust.
              </h1>
              <p className="text-subtle text-base leading-relaxed sm:text-lg">
                Mind Stack turns scattered research into a coherent graph. Capture
                context, ask AI questions, and keep every answer linked back to the
                source.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button render={<Link href="/auth/login" />}>
                  Start free
                  <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" render={<Link href="/app/search" />}>
                  Explore search
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/60 px-3 py-1.5">
                  Research-first UX
                </span>
                <span className="rounded-full border border-border/60 px-3 py-1.5">
                  Private by design
                </span>
                <span className="rounded-full border border-border/60 px-3 py-1.5">
                  Built for speed
                </span>
              </div>
            </div>

            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="size-3.5" />
                    Intelligence feed
                  </div>
                  <Badge variant="outline">Live</Badge>
                </div>
                <CardTitle>Today’s focus</CardTitle>
                <CardDescription>
                  Priority work surfaced from your knowledge graph.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-3">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Due for review</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    6 documents
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recency + relevance scoring.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Active threads</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    4 AI chats
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Continue conversations instantly.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Avg. answer time
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      1.6s
                    </p>
                  </div>
                  <Timer className="size-5 text-muted-foreground" />
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

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Workflow
            </p>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Turn raw inputs into trusted answers.
            </h2>
            <p className="text-subtle text-base">
              Mind Stack keeps a clean pipeline from capture to insight so teams
              spend time acting, not searching.
            </p>
            <div className="flex flex-col gap-3">
              {workflow.map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="rounded-md border border-border/60 bg-muted/40 p-2">
                    <step.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <feature.icon className="size-4 text-foreground" />
                    {feature.title}
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-subtle bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Security + reliability
            </p>
            <h3 className="text-2xl font-semibold text-foreground">
              Built with production-grade auth and auditability.
            </h3>
            <p className="text-subtle max-w-xl">
              Sessions are revocable, tokens are short-lived, and every answer
              is traceable back to source material.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                <CheckCheck className="size-3.5" />
                HTTP-only cookies
              </span>
              <span className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                <CheckCheck className="size-3.5" />
                Session revocation
              </span>
              <span className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                <CheckCheck className="size-3.5" />
                OAuth ready
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/auth/login" />}>
              Start free
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" render={<Link href="/app/settings" />}>
              Configure workspace
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

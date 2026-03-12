'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { Bot, BrainCircuit, FileText, Layers, Search, ShieldCheck } from 'lucide-react';

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
    description: 'Surface hidden paths between people, projects, and themes.',
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
    description: 'Cookie-based auth with revocation keeps access tight.',
    icon: ShieldCheck,
  },
  {
    title: 'Scales gracefully',
    description: 'From solo research to team knowledge ops.',
    icon: Layers,
  },
];

const Benefits = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Benefits
          </p>
          <h3 className="text-2xl font-semibold text-foreground">
            Your all-purpose knowledge platform.
          </h3>
          <p className="text-subtle max-w-2xl text-base">
            Discover advanced features that keep research flowing without the
            overload.
          </p>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <Button render={<Link href="/auth/login" />}>Get started</Button>
          <Button variant="outline" render={<Link href="/app" />}>
            Book a demo
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
};

export default Benefits;

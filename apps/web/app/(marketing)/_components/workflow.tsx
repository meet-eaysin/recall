import Link from 'next/link';
import {

  FileText,

  Search,
  Sparkles,

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

const workflow = [
  {
    title: 'Connect your sources',
    description: 'Bring docs, links, and notes into one space.',
    icon: FileText,
  },
  {
    title: 'Set your knowledge rules',
    description: 'Control what gets summarized, tagged, or surfaced.',
    icon: Sparkles,
  },
  {
    title: 'Ask and share',
    description: 'Answer questions with sources and share the result.',
    icon: Search,
  },
];

const Workflow = () => {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            A knowledge flow you can trust.
          </h2>
          <p className="text-subtle text-base">
            Capture, enrich, and retrieve without losing context or source of
            truth.
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
            <div className="flex flex-wrap gap-3">
              <Button render={<Link href="/auth/login" />}>Get started</Button>
              <Button variant="outline" render={<Link href="/app" />}>
                Explore the app
              </Button>
            </div>
          </div>
        </div>

        <Card className="h-full">
          <CardHeader>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <CardTitle>Knowledge availability</CardTitle>
            <CardDescription>
              Set buffers, limit sessions, and define how work flows in.
            </CardDescription>
          </CardHeader>
          <CardPanel className="space-y-3">
            <div className="grid gap-2 rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Minimum notice</span>
                <Badge variant="outline">24 hours</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Buffer before</span>
                <Badge variant="outline">30 mins</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Buffer after</span>
                <Badge variant="outline">30 mins</Badge>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Personal link</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                mindstack.io/you
              </p>
            </div>
          </CardPanel>
        </Card>
      </div>
    </section>
  );
};

export default Workflow
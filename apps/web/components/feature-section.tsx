import { cn } from '@/lib/utils';
import type React from 'react';
import {
  CpuIcon,
  FileTextIcon,
  LinkIcon,
  NetworkIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserRoundIcon,
} from 'lucide-react';

const features = [
  {
    id: 'local-first',
    anchor: 'local-first',
    children: <SetupVisual />,
    className: 'md:col-span-2',
  },
  {
    id: 'private-by-default',
    anchor: 'private-by-default',
    children: <UserBasedSecurity />,
    className: 'md:col-span-2',
  },
  {
    id: 'ask-ai',
    anchor: 'ask-ai',
    children: <ReportsVisual />,
    className: 'sm:col-span-2 md:col-span-2',
  },
  {
    id: 'document-first',
    anchor: 'document-first',
    children: <DashboardVisual />,
    className: 'sm:col-span-2 md:col-span-3 p-0',
  },
  {
    id: 'knowledge-graph',
    anchor: 'knowledge-graph',
    children: <PresenceVisual />,
    className: 'sm:col-span-2 md:col-span-3 p-0',
  },
];

export function FeatureSection() {
  return (
    <div
      className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6"
      id="features"
    >
      {features.map((feature) => (
        <FeatureCard
          className={feature.className}
          id={feature.anchor}
          key={feature.id}
        >
          {feature.children}
        </FeatureCard>
      ))}
    </div>
  );
}

function FeatureCard({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden border bg-background px-8 pt-8 pb-6',
        className,
      )}
      id={id}
    >
      {children}
    </div>
  );
}

function FeatureTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      className={cn('font-medium text-foreground text-lg', className)}
      {...props}
    />
  );
}

function FeatureDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p className={cn('text-muted-foreground text-sm', className)} {...props} />
  );
}

function SetupVisual() {
  return (
    <>
      <div className="relative mx-auto flex size-32 items-center justify-center rounded-full border-4 border-dashed bg-background shadow-xs outline outline-border outline-offset-4">
        <div className="absolute inset-0 z-10 scale-120 bg-radial from-primary/20 via-primary/5 to-transparent blur-xl" />
        <div className="relative z-10 grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground">
          <span className="rounded-sm border bg-card px-2 py-1 text-foreground">
            Postgres
          </span>
          <span className="rounded-sm border bg-card px-2 py-1 text-foreground">
            Chroma
          </span>
          <span className="rounded-sm border bg-card px-2 py-1 text-foreground">
            Redis
          </span>
          <span className="rounded-sm border bg-card px-2 py-1 text-foreground">
            Recall
          </span>
        </div>
      </div>

      <div className="relative mt-8 space-y-1.5 text-center">
        <FeatureTitle>Developer First</FeatureTitle>
        <FeatureDescription>
          Built for developers who value privacy and performance. Deploy
          anywhere in minutes.
        </FeatureDescription>
      </div>
    </>
  );
}

function UserBasedSecurity() {
  return (
    <>
      <div className="relative mx-auto flex size-32 items-center justify-center rounded-full border bg-background shadow-xs outline outline-border outline-offset-4">
        <div className="relative">
          <ShieldCheckIcon className="size-14 text-primary" />
          <div className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full border bg-card">
            <UserRoundIcon className="size-4 text-muted-foreground" />
          </div>
        </div>
        <div className="absolute inset-0 scale-120 bg-radial from-foreground/15 via-foreground/5 to-transparent blur-xl" />
      </div>

      <div className="relative mt-8 space-y-1.5 text-center">
        <FeatureTitle>Private by default</FeatureTitle>
        <FeatureDescription>
          Everything is per-user with strict isolation. No collaboration, no
          feeds, no noise.
        </FeatureDescription>
      </div>
    </>
  );
}

function ReportsVisual() {
  return (
    <>
      <div className="relative min-h-32">
        <div className="absolute top-6 left-6 max-w-[60%] rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground shadow-xs">
          Q: What did I read about vector search?
        </div>
        <div className="absolute top-14 right-6 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
          <SparklesIcon className="size-3 text-primary" />
          A: Here&apos;s the summary with sources.
        </div>
        <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-1">
            <FileTextIcon className="size-3" /> [1]
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-1">
            <LinkIcon className="size-3" /> [2]
          </span>
        </div>
      </div>
      <div className="relative z-10 mt-8 space-y-1.5 text-center">
        <FeatureTitle>Ask with sources</FeatureTitle>
        <FeatureDescription>
          Ask questions and get answers grounded in your library with citations.
        </FeatureDescription>
      </div>
    </>
  );
}

function DashboardVisual() {
  return (
    <div className="grid h-full sm:grid-cols-2">
      <div className="relative z-10 space-y-6 py-8 ps-8 pe-2">
        <div className="flex size-12 items-center justify-center rounded-full border bg-card shadow-xs outline outline-border/80 outline-offset-2">
          <FileTextIcon className="size-5 text-primary/80" />
        </div>
        <div className="space-y-2">
          <FeatureTitle className="text-base">
            Document-first workflow
          </FeatureTitle>
          <FeatureDescription>
            See the original source, notes, tags, and summaries without exposing
            internal AI pipelines.
          </FeatureDescription>
        </div>
      </div>
      {/* Dashboard Screen */}
      <div className="mask-b-from-90% mask-r-from-90% relative aspect-video sm:aspect-auto">
        <div className="absolute -right-1 -bottom-1 aspect-video max-h-50 rounded-tl-md border bg-card p-3 sm:max-h-42 md:aspect-square md:max-h-50 lg:aspect-16/12">
          <div className="flex h-full flex-col gap-3 rounded-tl-sm border bg-background p-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md border bg-card">
                <FileTextIcon className="size-4 text-primary/80" />
              </div>
              <div className="text-xs font-medium">Deep Dive on RAG</div>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <span className="rounded-full border bg-card px-2 py-1">
                paper
              </span>
              <span className="rounded-full border bg-card px-2 py-1">
                vector
              </span>
              <span className="rounded-full border bg-card px-2 py-1">
                retrieval
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-4/5 rounded bg-muted" />
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-2/3 rounded bg-muted" />
            </div>
            <div className="mt-auto flex items-center gap-2 text-[11px] text-muted-foreground">
              <CpuIcon className="size-3" />
              Summary generated on request
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PresenceVisual() {
  return (
    <div className="grid max-h-120 sm:grid-cols-2">
      <div className="space-y-6 pt-8 pb-4 pl-8 sm:pb-8">
        <div className="flex size-12 items-center justify-center rounded-full border bg-card shadow-xs outline outline-border/80 outline-offset-2">
          <NetworkIcon className="size-5 text-primary/80" />
        </div>
        <div className="space-y-2">
          <FeatureTitle className="text-base">Knowledge Graph</FeatureTitle>
          <FeatureDescription>
            Explore your personal knowledge graph. Recall automatically connects
            your docs and ideas.
          </FeatureDescription>
        </div>
      </div>
      <div className="relative">
        <GraphPreview className="absolute right-0 top-4 hidden sm:block" />
      </div>
    </div>
  );
}

function GraphPreview(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      className={cn('h-48 w-56 text-primary/70', props.className)}
      fill="none"
      viewBox="0 0 240 180"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M40 120L90 60L140 110L190 70"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <path
        d="M90 60L140 30L190 70"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <circle cx="40" cy="120" r="8" className="fill-primary/30" />
      <circle cx="90" cy="60" r="10" className="fill-primary/50" />
      <circle cx="140" cy="110" r="9" className="fill-primary/40" />
      <circle cx="190" cy="70" r="12" className="fill-primary/60" />
      <circle cx="140" cy="30" r="8" className="fill-primary/30" />
    </svg>
  );
}

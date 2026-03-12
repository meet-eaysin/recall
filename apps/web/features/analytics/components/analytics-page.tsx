'use client';

import { format, parseISO } from 'date-fns';
import {
  Activity,
  CalendarRange,
  Flame,
  MousePointerClick,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import type { AnalyticsHeatmapItem } from '@repo/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAnalyticsHeatmap, useAnalyticsStats } from '../hooks';

const WEEKDAY_LABELS = ['Mon', 'Wed', 'Fri', 'Sun'];

function getHeatTone(count: number, max: number) {
  if (count <= 0 || max <= 0) return 'bg-muted/40';

  const ratio = count / max;
  if (ratio < 0.25) return 'bg-sky-100 dark:bg-sky-950/60';
  if (ratio < 0.5) return 'bg-sky-200 dark:bg-sky-900/70';
  if (ratio < 0.75) return 'bg-sky-400 dark:bg-sky-700';
  return 'bg-sky-600 dark:bg-sky-500';
}

function groupIntoWeeks(items: AnalyticsHeatmapItem[]) {
  const weeks: AnalyticsHeatmapItem[][] = [];

  for (let index = 0; index < items.length; index += 7) {
    weeks.push(items.slice(index, index + 7));
  }

  return weeks;
}

function Heatmap({
  items,
  isLoading,
}: {
  items: AnalyticsHeatmapItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-52 w-full rounded-xl" />;
  }

  if (items.length === 0) {
    return (
      <Empty className="min-h-0 rounded-xl border border-dashed border-border/70 px-6 py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarRange className="size-4" />
          </EmptyMedia>
          <EmptyTitle>No activity yet</EmptyTitle>
          <EmptyDescription>
            Once you start reading, opening documents, and generating summaries,
            your activity pattern will show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const weeks = groupIntoWeeks(items);
  const maxCount = items.reduce((highest, item) => Math.max(highest, item.count), 0);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-3">
        <div className="grid shrink-0 grid-rows-7 gap-1.5 pt-6 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex h-4 items-center">
                  {items[index] &&
                  WEEKDAY_LABELS.includes(format(parseISO(items[index].date), 'EEE'))
                    ? format(parseISO(items[index].date), 'EEE')
                    : ''}
                </div>
              ))}
        </div>
        <div className="flex gap-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="space-y-1.5">
              <div className="h-5 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {week[0] ? format(parseISO(week[0].date), 'MMM d') : ''}
              </div>
              <div className="grid grid-rows-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const item = week[dayIndex];

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        'size-4 rounded-[6px] border border-border/30 transition',
                        item ? getHeatTone(item.count, maxCount) : 'bg-transparent',
                      )}
                      title={
                        item
                          ? `${format(parseISO(item.date), 'PPP')}: ${item.count} actions`
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
}: {
  description: string;
  icon: typeof Flame;
  isLoading: boolean;
  title: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardDescription>{title}</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <CardTitle className="text-3xl">{value}</CardTitle>
            )}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardPanel className="pt-0 text-sm text-muted-foreground">
        {description}
      </CardPanel>
    </Card>
  );
}

import { PageContainer } from '@/features/workspace/components/page-container';

export function AnalyticsPage() {
  const { data: stats, error: statsError, isLoading: statsLoading } =
    useAnalyticsStats();
  const { data: heatmap, error: heatmapError, isLoading: heatmapLoading } =
    useAnalyticsHeatmap(84);

  const recentHeatmap = heatmap?.heatmap ?? [];
  const totals = recentHeatmap.reduce(
    (acc, item) => {
      acc.docAdded += item.breakdown.doc_added;
      acc.docOpened += item.breakdown.doc_opened;
      acc.noteCreated += item.breakdown.note_created;
      acc.summaryGenerated += item.breakdown.summary_generated;
      return acc;
    },
    {
      docAdded: 0,
      docOpened: 0,
      noteCreated: 0,
      summaryGenerated: 0,
    },
  );
  
  const topDays = [...recentHeatmap]
    .sort((left, right) => right.count - left.count)
    .slice(0, 5)
    .filter((item) => item.count > 0);

  return (
    <PageContainer className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track consistency over time, see where your activity comes from, and spot your strongest learning rhythm.</p>
      </header>
      <div className="mt-4 space-y-4">
        {statsError ? (
          <Alert variant="error">
            <AlertTitle>Analytics unavailable</AlertTitle>
            <AlertDescription>{(statsError as Error).message}</AlertDescription>
          </Alert>
        ) : null}
        {heatmapError ? (
          <Alert variant="error">
            <AlertTitle>Activity history unavailable</AlertTitle>
            <AlertDescription>{(heatmapError as Error).message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Current streak"
            value={stats?.currentStreak ?? 0}
            description="How many consecutive days you have stayed active recently."
            icon={Flame}
            isLoading={statsLoading}
          />
          <StatCard
            title="Longest streak"
            value={stats?.longestStreak ?? 0}
            description="Your best sustained run so far across all recorded activity."
            icon={Activity}
            isLoading={statsLoading}
          />
          <StatCard
            title="Most active day"
            value={
              stats?.mostActiveDay
                ? format(parseISO(stats.mostActiveDay), 'MMM d')
                : 'None yet'
            }
            description="The day with the highest combined reading, notes, and summary activity."
            icon={CalendarRange}
            isLoading={statsLoading}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>84-day activity map</CardTitle>
                  <CardDescription>
                    A compact view of the last twelve weeks of actual usage.
                  </CardDescription>
                </div>
                <Badge variant="outline">{recentHeatmap.length} days tracked</Badge>
              </div>
            </CardHeader>
            <CardPanel className="space-y-4">
              <Heatmap items={recentHeatmap} isLoading={heatmapLoading} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={cn(
                        'size-3 rounded-[4px] border border-border/30',
                        getHeatTone(index, 3),
                      )}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </CardPanel>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity mix</CardTitle>
              <CardDescription>
                What has been driving your recent activity volume.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-3">
              {heatmapLoading ? (
                <>
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </>
              ) : (
                <>
                  {[
                    {
                      icon: Activity,
                      label: 'Documents added',
                      value: totals.docAdded,
                    },
                    {
                      icon: MousePointerClick,
                      label: 'Documents opened',
                      value: totals.docOpened,
                    },
                    {
                      icon: NotebookPen,
                      label: 'Notes created',
                      value: totals.noteCreated,
                    },
                    {
                      icon: Sparkles,
                      label: 'Summaries generated',
                      value: totals.summaryGenerated,
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-border/60 bg-background p-2">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            Last 84 days
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </>
              )}
            </CardPanel>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Best days</CardTitle>
            <CardDescription>
              The strongest activity spikes in the current analysis window.
            </CardDescription>
          </CardHeader>
          <CardPanel className="space-y-2">
            {heatmapLoading ? (
              <>
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </>
            ) : null}

            {!heatmapLoading && topDays.length === 0 ? (
              <Empty className="min-h-0 px-0 py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Flame className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No standout days yet</EmptyTitle>
                  <EmptyDescription>
                    Once activity starts to accumulate, your strongest days will show up here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {topDays.map((item) => (
              <div
                key={item.date}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {format(parseISO(item.date), 'EEEE, MMM d')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.breakdown.doc_opened} opens, {item.breakdown.note_created}{' '}
                    notes, {item.breakdown.summary_generated} summaries
                  </p>
                </div>
                <Badge variant="secondary">{item.count} actions</Badge>
              </div>
            ))}
          </CardPanel>
        </Card>
      </div>
    </PageContainer>
  );
}

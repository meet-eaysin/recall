'use client';

import {
  ArrowLeft,
  LaptopMinimal,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/features/workspace/components/page-container';
import {
  useCurrentSession,
  useRevokeUserSession,
  useUserSessions,
} from '../hooks';

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return LaptopMinimal;
  const value = userAgent.toLowerCase();
  if (
    value.includes('iphone') ||
    value.includes('android') ||
    value.includes('mobile')
  ) {
    return Smartphone;
  }
  return LaptopMinimal;
}

export function SecurityPage() {
  const { data: sessions, error, isLoading } = useUserSessions();
  const { data: currentSession } = useCurrentSession();
  const revokeSession = useRevokeUserSession();

  return (
    <PageContainer className="space-y-8">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/app/settings" />}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground">
            Review the sessions that can currently access your account and
            revoke any that should no longer remain active.
          </p>
        </div>
      </header>
      <div className="mt-4 space-y-4">
        {error ? (
          <Alert variant="error">
            <AlertTitle>Security data unavailable</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Current session</CardDescription>
              <CardTitle className="text-lg">
                {currentSession?.session.id ? 'Protected' : 'Unavailable'}
              </CardTitle>
            </CardHeader>
            <CardPanel className="pt-0 text-sm text-muted-foreground">
              The session you are using right now cannot be revoked from this
              page.
            </CardPanel>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active sessions</CardDescription>
              <CardTitle className="text-lg">{sessions?.length ?? 0}</CardTitle>
            </CardHeader>
            <CardPanel className="pt-0 text-sm text-muted-foreground">
              Each listed session currently holds a valid authenticated context.
            </CardPanel>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Revokable sessions</CardDescription>
              <CardTitle className="text-lg">
                {(
                  sessions?.filter((session) => !session.current).length ?? 0
                ).toString()}
              </CardTitle>
            </CardHeader>
            <CardPanel className="pt-0 text-sm text-muted-foreground">
              Remove old devices when you no longer trust or need them.
            </CardPanel>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session list</CardTitle>
            <CardDescription>
              This backend currently supports viewing sessions and revoking any
              non-current session.
            </CardDescription>
          </CardHeader>
          <CardPanel className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : null}

            {!isLoading && (sessions?.length ?? 0) === 0 ? (
              <Empty className="min-h-0 px-0 py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShieldCheck className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No sessions found</EmptyTitle>
                  <EmptyDescription>
                    The backend did not return any active sessions for this
                    user.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {sessions?.map((session) => {
              const DeviceIcon = getDeviceIcon(session.userAgent);

              return (
                <div
                  key={session.sessionId}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-lg border px-4 py-4"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="rounded-lg border bg-muted/35 p-2">
                      <DeviceIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {session.userAgent || 'Unknown device'}
                        </p>
                        {session.current ? (
                          <Badge variant="secondary">Current</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        IP address: {session.ipAddress || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {new Date(session.expiresAt).toLocaleString()}
                      </p>
                      <p className="mt-2 break-all text-xs text-muted-foreground">
                        {session.sessionId}
                      </p>
                    </div>
                  </div>

                  {session.current ? (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4" />
                      Current session stays active here.
                    </div>
                  ) : (
                    <ConfirmationDialog
                      confirmLabel="Revoke session"
                      description="This device will lose access immediately and will need to authenticate again."
                      isPending={
                        revokeSession.isPending &&
                        revokeSession.variables === session.sessionId
                      }
                      confirmAction={async () => {
                        await revokeSession.mutateAsync(session.sessionId);
                      }}
                      title="Revoke this session?"
                      tone="destructive"
                      trigger={
                        <Button size="sm" variant="destructive-outline">
                          <Trash2 className="size-4" />
                          Revoke
                        </Button>
                      }
                    />
                  )}
                </div>
              );
            })}
          </CardPanel>
        </Card>
      </div>
    </PageContainer>
  );
}

'use client';

import { LaptopMinimal, Smartphone, Trash2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevokeUserSession, useUserSessions } from '../hooks';

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return LaptopMinimal;
  const value = userAgent.toLowerCase();
  if (value.includes('iphone') || value.includes('android') || value.includes('mobile')) {
    return Smartphone;
  }
  return LaptopMinimal;
}

export function SecurityTab() {
  const { data: sessions, isLoading } = useUserSessions();
  const revokeSession = useRevokeUserSession();

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Security Sessions</CardTitle>
          <CardDescription>
            Review and manage the devices currently logged into your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions?.map((session) => {
                const DeviceIcon = getDeviceIcon(session.userAgent);
                return (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="size-10 rounded-lg border bg-background flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <DeviceIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{session.userAgent || 'Unknown device'}</p>
                          {session.current && <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Current</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">IP: {session.ipAddress || 'Unknown'}</p>
                      </div>
                    </div>

                    {!session.current && (
                      <ConfirmationDialog
                        confirmLabel="Revoke session"
                        description="This device will be logged out immediately."
                        isPending={revokeSession.isPending && revokeSession.variables === session.sessionId}
                        confirmAction={async () => {
                          await revokeSession.mutateAsync(session.sessionId);
                        }}
                        title="Revoke session?"
                        tone="destructive"
                        trigger={
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="size-4" />
                          </Button>
                        }
                      />
                    )}
                  </div>
                );
              })}
              {sessions?.length === 1 && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border/60 text-muted-foreground bg-muted/5">
                  <ShieldCheck className="size-5" />
                  <p className="text-sm">No other active sessions found.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

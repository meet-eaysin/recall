'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCcw, Unplug, Workflow } from 'lucide-react';
import { NotionSyncDirectionType } from '@repo/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useConnectNotion,
  useDisconnectNotion,
  useNotionConfig,
  useNotionDatabases,
  useSyncNotion,
  useUpdateNotionConfig,
} from '../hooks';
import { toast } from 'sonner';

const SYNC_DIRECTION_OPTIONS = [
  { label: 'To Notion', value: NotionSyncDirectionType.TO_NOTION },
  { label: 'Both directions', value: NotionSyncDirectionType.BOTH },
];

export function NotionTab() {
  const { data: config, isLoading } = useNotionConfig();
  const connectNotion = useConnectNotion();
  const updateConfig = useUpdateNotionConfig();
  const syncNotion = useSyncNotion();
  const disconnectNotion = useDisconnectNotion();

  const { data: databases } = useNotionDatabases(Boolean(config));

  const [accessToken, setAccessToken] = useState('');
  const [targetDatabaseId, setTargetDatabaseId] = useState('none');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncDirection, setSyncDirection] = useState<NotionSyncDirectionType>(
    NotionSyncDirectionType.BOTH,
  );

  useEffect(() => {
    if (config) {
      setTargetDatabaseId(config.targetDatabaseId ?? 'none');
      setSyncEnabled(config.syncEnabled);
      setSyncDirection(config.syncDirection);
    }
  }, [config]);

  const selectedDatabaseLabel = useMemo(() => {
    if (targetDatabaseId === 'none') return 'No database selected';
    return (
      databases?.find((db) => db.id === targetDatabaseId)?.title ??
      'Selected database'
    );
  }, [databases, targetDatabaseId]);

  const handleConnect = async () => {
    try {
      await connectNotion.mutateAsync(accessToken.trim());
      setAccessToken('');
      toast.success('Connected to Notion');
    } catch (_err) {
      toast.error('Connection failed');
    }
  };

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        syncDirection,
        syncEnabled,
        targetDatabaseId:
          targetDatabaseId === 'none' ? undefined : targetDatabaseId,
      });
      toast.success('Settings updated');
    } catch (_err) {
      toast.error('Update failed');
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncNotion.mutateAsync();
      if (result.failed > 0) {
        toast.warning(
          `Sync partially completed: ${result.synced} success, ${result.failed} failed`,
        );
      } else {
        toast.success(`Synced ${result.synced} items`);
      }
    } catch (_err) {
      toast.error('Sync failed');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      {!config ? (
        <Card className="border-border/60 shadow-sm border-dashed">
          <CardHeader>
            <CardTitle>Connect Notion Workspace</CardTitle>
            <CardDescription>
              Enter your Notion integration token to enable synchronization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Token</label>
              <Input
                type="password"
                placeholder="secret_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="rounded-lg shadow-sm"
              />
            </div>
            <Button
              disabled={!accessToken.trim() || connectNotion.isPending}
              onClick={handleConnect}
              className="rounded-lg"
            >
              <Workflow className="size-4 mr-2" />
              {connectNotion.isPending ? 'Connecting...' : 'Connect Notion'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Sync Configuration</CardTitle>
              <CardDescription>
                Manage how content is synchronized between Recall and Notion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground/80">
                    Target Database
                  </label>
                  <Select
                    value={targetDatabaseId}
                    onValueChange={setTargetDatabaseId}
                  >
                    <SelectTrigger className="rounded-lg bg-muted/20 border-border/40 hover:bg-muted/30 transition-colors">
                      <SelectValue>{selectedDatabaseLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No database selected</SelectItem>
                      {databases?.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          {db.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground/80">
                      Sync Direction
                    </label>
                    <Select
                      value={syncDirection}
                      onValueChange={(v) =>
                        setSyncDirection(v as NotionSyncDirectionType)
                      }
                    >
                      <SelectTrigger className="rounded-lg bg-muted/20 border-border/40 hover:bg-muted/30 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYNC_DIRECTION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Automation
                      </p>
                      <p className="text-sm font-medium">Automatic Sync</p>
                    </div>
                    <Switch
                      checked={syncEnabled}
                      onCheckedChange={setSyncEnabled}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/40">
                <Button
                  onClick={handleSave}
                  disabled={updateConfig.isPending}
                  className="rounded-lg shadow-sm"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  {updateConfig.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={syncNotion.isPending}
                  className="rounded-lg shadow-sm"
                >
                  <RefreshCcw className="size-4 mr-2" />
                  {syncNotion.isPending ? 'Syncing...' : 'Sync Now'}
                </Button>
                <ConfirmationDialog
                  confirmLabel="Disconnect"
                  description="This will remove your Notion access token and stop all synchronization."
                  isPending={disconnectNotion.isPending}
                  confirmAction={() => disconnectNotion.mutateAsync()}
                  title="Disconnect Notion?"
                  tone="destructive"
                  trigger={
                    <Button
                      variant="outline"
                      className="text-destructive border-border/40 hover:bg-destructive/10 rounded-lg"
                    >
                      <Unplug className="size-4 mr-2" />
                      Disconnect
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-muted/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Workspace Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="p-3 rounded-lg border border-border/40 bg-background/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  Workspace Name
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {config.workspaceName || 'Unknown'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-background/50 overflow-hidden">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  Workspace ID
                </p>
                <p className="mt-1 text-xs truncate font-mono text-muted-foreground">
                  {config.workspaceId}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-background/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  Last Synced
                </p>
                <p className="mt-1 text-sm font-semibold truncate">
                  {config.lastSyncedAt
                    ? new Date(config.lastSyncedAt).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

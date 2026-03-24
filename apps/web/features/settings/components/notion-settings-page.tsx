'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  RefreshCcw,
  Unplug,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { NotionSyncDirectionType } from '@repo/types';
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
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/features/workspace/components/page-container';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/lib/api';
import {
  useConnectNotion,
  useDisconnectNotion,
  useNotionConfig,
  useNotionDatabases,
  useSyncNotion,
  useUpdateNotionConfig,
} from '../hooks';

function isNotConfigured(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

const SYNC_DIRECTION_OPTIONS = [
  { label: 'To Notion', value: NotionSyncDirectionType.TO_NOTION },
  { label: 'From Notion', value: NotionSyncDirectionType.FROM_Notion },
  { label: 'Both directions', value: NotionSyncDirectionType.BOTH },
];

export function NotionSettingsPage() {
  const { data: config, error, isLoading } = useNotionConfig();
  const connectNotion = useConnectNotion();
  const updateConfig = useUpdateNotionConfig();
  const syncNotion = useSyncNotion();
  const disconnectNotion = useDisconnectNotion();
  const isDisconnected = isNotConfigured(error);
  const fatalError = error && !isDisconnected ? (error as Error) : null;

  const { data: databases, isLoading: databasesLoading } = useNotionDatabases(
    Boolean(config),
  );

  const [accessToken, setAccessToken] = useState('');
  const [targetDatabaseId, setTargetDatabaseId] = useState('none');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncDirection, setSyncDirection] = useState<NotionSyncDirectionType>(
    NotionSyncDirectionType.BOTH,
  );
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const [syncSummary, setSyncSummary] = useState<{
    synced: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (!config) return;

    setTargetDatabaseId(config.targetDatabaseId ?? 'none');
    setSyncEnabled(config.syncEnabled);
    setSyncDirection(config.syncDirection);
    setFeedback(null);
    setSyncSummary(null);
  }, [config]);

  const selectedDatabaseLabel = useMemo(() => {
    if (targetDatabaseId === 'none') return 'No database selected';
    return (
      databases?.find((database) => database.id === targetDatabaseId)?.title ??
      'Selected database'
    );
  }, [databases, targetDatabaseId]);

  async function handleConnect() {
    setFeedback(null);

    try {
      await connectNotion.mutateAsync(accessToken.trim());
      setAccessToken('');
      setFeedback({
        message: 'Notion workspace connected successfully.',
        tone: 'success',
      });
    } catch (connectError) {
      setFeedback({
        message:
          connectError instanceof Error
            ? connectError.message
            : 'Failed to connect Notion.',
        tone: 'error',
      });
    }
  }

  async function handleSave() {
    setFeedback(null);

    try {
      await updateConfig.mutateAsync({
        syncDirection,
        syncEnabled,
        targetDatabaseId:
          targetDatabaseId === 'none' ? undefined : targetDatabaseId,
      });
      setFeedback({
        message: 'Notion sync settings updated.',
        tone: 'success',
      });
    } catch (updateError) {
      setFeedback({
        message:
          updateError instanceof Error
            ? updateError.message
            : 'Failed to update Notion settings.',
        tone: 'error',
      });
    }
  }

  async function handleSync() {
    setFeedback(null);
    setSyncSummary(null);

    try {
      const result = await syncNotion.mutateAsync();
      setSyncSummary(result);
      setFeedback({
        message: 'Notion sync completed.',
        tone: result.failed > 0 ? 'error' : 'success',
      });
    } catch (syncError) {
      setFeedback({
        message:
          syncError instanceof Error ? syncError.message : 'Sync failed.',
        tone: 'error',
      });
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Notion</h1>
          <p className="text-muted-foreground">
            Connect a workspace, choose the target database, and control how
            synchronization should behave.
          </p>
        </div>
      </header>
      <div className="mt-4 space-y-4">
        {fatalError ? (
          <Alert variant="error">
            <AlertTitle>Notion unavailable</AlertTitle>
            <AlertDescription>{fatalError.message}</AlertDescription>
          </Alert>
        ) : null}

        {feedback ? (
          <Alert variant={feedback.tone === 'success' ? 'success' : 'error'}>
            <AlertTitle>
              {feedback.tone === 'success'
                ? 'Update complete'
                : 'Request failed'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        ) : null}

        {syncSummary ? (
          <Alert variant={syncSummary.failed > 0 ? 'warning' : 'success'}>
            <AlertTitle>Last sync result</AlertTitle>
            <AlertDescription>
              <p>
                {syncSummary.synced} item(s) synced, {syncSummary.failed}{' '}
                failed.
              </p>
              {syncSummary.errors.length > 0 ? (
                <div className="space-y-1">
                  {syncSummary.errors.slice(0, 3).map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {!config && !isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect a workspace</CardTitle>
              <CardDescription>
                Start by providing a valid Notion access token for your
                workspace.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-4">
              <Field>
                <FieldLabel htmlFor="notion-access-token">
                  Access token
                </FieldLabel>
                <Input
                  id="notion-access-token"
                  onChange={(event) => setAccessToken(event.target.value)}
                  placeholder="secret_..."
                  type="password"
                  value={accessToken}
                />
                <FieldDescription>
                  The backend stores the integration and uses it to fetch
                  available databases.
                </FieldDescription>
              </Field>
              <div className="flex gap-2">
                <Button
                  disabled={!accessToken.trim() || connectNotion.isPending}
                  onClick={() => void handleConnect()}
                >
                  <Workflow className="size-4" />
                  {connectNotion.isPending ? 'Connecting...' : 'Connect Notion'}
                </Button>
              </div>
            </CardPanel>
          </Card>
        ) : null}

        {isLoading ? (
          <Card>
            <CardPanel className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardPanel>
          </Card>
        ) : null}

        {config ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Sync settings</CardTitle>
                <CardDescription>
                  Tune the integration after the workspace is connected.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-4">
                <Field>
                  <FieldLabel>Target database</FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      setTargetDatabaseId(value ?? 'none')
                    }
                    value={targetDatabaseId}
                  >
                    <SelectTrigger>
                      <SelectValue>{selectedDatabaseLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No database selected</SelectItem>
                      {databases?.map((database) => (
                        <SelectItem key={database.id} value={database.id}>
                          {database.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Pick the database that should receive synced content.
                  </FieldDescription>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Sync direction</FieldLabel>
                    <Select
                      onValueChange={(value) =>
                        setSyncDirection(value as NotionSyncDirectionType)
                      }
                      value={syncDirection}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {
                            SYNC_DIRECTION_OPTIONS.find(
                              (item) => item.value === syncDirection,
                            )?.label
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SYNC_DIRECTION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Automatic sync</FieldLabel>
                    <div className="flex min-h-10 items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Keep sync enabled
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Background sync can use this setting.
                        </p>
                      </div>
                      <Switch
                        checked={syncEnabled}
                        onCheckedChange={(value) =>
                          setSyncEnabled(Boolean(value))
                        }
                      />
                    </div>
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={updateConfig.isPending}
                    onClick={() => void handleSave()}
                  >
                    <CheckCircle2 className="size-4" />
                    {updateConfig.isPending ? 'Saving...' : 'Save settings'}
                  </Button>
                  <Button
                    disabled={syncNotion.isPending}
                    onClick={() => void handleSync()}
                    variant="outline"
                  >
                    <RefreshCcw className="size-4" />
                    {syncNotion.isPending ? 'Syncing...' : 'Sync now'}
                  </Button>
                  <ConfirmationDialog
                    confirmLabel="Disconnect"
                    description="This removes the saved Notion integration and stops future sync actions."
                    isPending={disconnectNotion.isPending}
                    confirmAction={() => disconnectNotion.mutateAsync()}
                    title="Disconnect this Notion workspace?"
                    tone="destructive"
                    trigger={
                      <Button variant="destructive-outline">
                        <Unplug className="size-4" />
                        Disconnect
                      </Button>
                    }
                  />
                </div>
              </CardPanel>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Workspace</CardTitle>
                  <CardDescription>
                    Integration details currently stored in the backend.
                  </CardDescription>
                </CardHeader>
                <CardPanel className="space-y-3">
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Workspace name
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {config.workspaceName || 'Unnamed workspace'}
                    </p>
                  </div>
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Workspace ID
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-foreground">
                      {config.workspaceId}
                    </p>
                  </div>
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs text-muted-foreground">Sync status</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge
                        variant={config.syncEnabled ? 'secondary' : 'outline'}
                      >
                        {config.syncEnabled ? 'Enabled' : 'Paused'}
                      </Badge>
                      <Badge variant="outline">
                        {
                          SYNC_DIRECTION_OPTIONS.find(
                            (item) => item.value === config.syncDirection,
                          )?.label
                        }
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {config.lastSyncedAt
                        ? `Last synced ${new Date(config.lastSyncedAt).toLocaleString()}`
                        : 'No sync recorded yet'}
                    </p>
                  </div>
                </CardPanel>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available databases</CardTitle>
                  <CardDescription>
                    Databases exposed by the connected Notion workspace.
                  </CardDescription>
                </CardHeader>
                <CardPanel className="space-y-2">
                  {databasesLoading ? (
                    <>
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </>
                  ) : null}

                  {!databasesLoading && (databases?.length ?? 0) === 0 ? (
                    <Empty className="min-h-0 rounded-lg border border-dashed px-4 py-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Database className="size-4" />
                        </EmptyMedia>
                        <EmptyTitle>No databases returned</EmptyTitle>
                        <EmptyDescription>
                          The workspace is connected, but no accessible
                          databases were found.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : null}

                  {databases?.map((database) => (
                    <div
                      key={database.id}
                      className="rounded-lg border px-4 py-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {database.title}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {database.id}
                      </p>
                    </div>
                  ))}
                </CardPanel>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Bot, ShieldCheck, UserCircle2, Workflow } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import {
  useCurrentSession,
  useCurrentUser,
  useLLMConfig,
  useNotionConfig,
  useUserSessions,
} from '../hooks';

function isNotConfigured(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

import { PageContainer } from '@/features/workspace/components/page-container';

export function SettingsPage() {
  const {
    data: user,
    error: userError,
    isLoading: userLoading,
  } = useCurrentUser();
  const { data: session } = useCurrentSession();
  const { data: sessions } = useUserSessions();
  const { data: llmConfig, error: llmError } = useLLMConfig();
  const { data: notionConfig, error: notionError } = useNotionConfig();

  const activeConfig = useMemo(() => {
    if (!llmConfig?.configs?.length) return null;
    if (llmConfig.activeConfigId) {
      return (
        llmConfig.configs.find((c) => c.id === llmConfig.activeConfigId) ||
        llmConfig.configs[0]
      );
    }
    return llmConfig.configs[0];
  }, [llmConfig]);

  const fatalLlmError =
    llmError && !isNotConfigured(llmError) ? (llmError as Error) : null;
  const fatalNotionError =
    notionError && !isNotConfigured(notionError)
      ? (notionError as Error)
      : null;

  return (
    <PageContainer className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, trusted sessions, and the integrations that power
          daily work.
        </p>
      </header>
      <div className="mt-4 space-y-4">
        {userError ? (
          <Alert variant="error">
            <AlertTitle>Settings unavailable</AlertTitle>
            <AlertDescription>{(userError as Error).message}</AlertDescription>
          </Alert>
        ) : null}
        {fatalLlmError ? (
          <Alert variant="error">
            <AlertTitle>LLM status unavailable</AlertTitle>
            <AlertDescription>{fatalLlmError.message}</AlertDescription>
          </Alert>
        ) : null}
        {fatalNotionError ? (
          <Alert variant="error">
            <AlertTitle>Notion status unavailable</AlertTitle>
            <AlertDescription>{fatalNotionError.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Identity and session details from the current authenticated
                user.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-4">
              {userLoading ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-4">
                    <Avatar className="size-14">
                      <AvatarImage
                        alt={user?.name || user?.email || 'User'}
                        src={user?.avatarUrl ?? undefined}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(user?.name || user?.email || 'U')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">
                        {user?.name || 'Unnamed user'}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user?.email || 'No email available'}
                      </p>
                    </div>
                    <Badge variant="secondary">Active account</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Current session
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-foreground">
                        {session?.session.id || 'Unavailable'}
                      </p>
                    </div>
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Other active sessions
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {Math.max((sessions?.length ?? 1) - 1, 0)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardPanel>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick status</CardTitle>
              <CardDescription>
                A quick read of the settings that affect the rest of the app.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-3">
              <div className="rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Security
                  </p>
                  <Badge variant="secondary">
                    {sessions?.length ?? 0} session
                    {(sessions?.length ?? 0) === 1 ? '' : 's'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review devices and revoke any session you no longer trust.
                </p>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    LLM config
                  </p>
                  <Badge variant={activeConfig ? 'secondary' : 'outline'}>
                    {activeConfig ? activeConfig.providerId : 'Not configured'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeConfig
                    ? `${activeConfig.modelId} is ready for AI features.`
                    : 'Save a provider and model set to enable AI-powered features.'}
                </p>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">Notion</p>
                  <Badge variant={notionConfig ? 'secondary' : 'outline'}>
                    {notionConfig ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {notionConfig
                    ? notionConfig.workspaceName || notionConfig.workspaceId
                    : 'Connect a workspace when you want cross-system sync.'}
                </p>
              </div>
            </CardPanel>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <ShieldCheck className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>
                Manage active sessions and remove device access you no longer
                want to keep.
              </CardDescription>
            </CardHeader>
            <CardPanel className="pt-0">
              <Button
                render={<Link href="/app/settings/security" />}
                variant="outline"
              >
                Review sessions
              </Button>
            </CardPanel>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">LLM Config</CardTitle>
              <CardDescription>
                Set provider credentials, model defaults, and validate the AI
                runtime.
              </CardDescription>
            </CardHeader>
            <CardPanel className="pt-0">
              <Button
                render={<Link href="/app/settings/llm" />}
                variant="outline"
              >
                Open LLM settings
              </Button>
            </CardPanel>
          </Card>

          <Card>
            <CardHeader>
              <Workflow className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Notion</CardTitle>
              <CardDescription>
                Connect a workspace, choose a target database, and trigger sync
                when needed.
              </CardDescription>
            </CardHeader>
            <CardPanel className="pt-0">
              <Button
                render={<Link href="/app/settings/notion" />}
                variant="outline"
              >
                Open Notion settings
              </Button>
            </CardPanel>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What this area controls</CardTitle>
            <CardDescription>
              Settings are intentionally focused on account trust and the
              integrations the backend currently supports.
            </CardDescription>
          </CardHeader>
          <CardPanel className="grid gap-3 md:grid-cols-3">
            {[
              {
                icon: UserCircle2,
                title: 'Account context',
                text: 'Identity, current session, and access context.',
              },
              {
                icon: ShieldCheck,
                title: 'Session trust',
                text: 'Session visibility and selective revoke support.',
              },
              {
                icon: Bot,
                title: 'Connected systems',
                text: 'AI provider setup and Notion workspace sync.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{title}</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </CardPanel>
        </Card>
      </div>
    </PageContainer>
  );
}

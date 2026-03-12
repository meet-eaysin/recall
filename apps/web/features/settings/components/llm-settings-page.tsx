'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Cpu,
  KeyRound,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import type { LLMConfigPublicView } from '@repo/types';
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
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { SaveLLMConfigInput } from '../api';
import {
  useDeleteLLMConfig,
  useLLMConfig,
  useSaveLLMConfig,
  useValidateLLMConfig,
} from '../hooks';

const DEFAULT_FORM: SaveLLMConfigInput = {
  provider: 'openai',
  chatModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  apiKey: '',
  baseUrl: '',
};

function isNotConfigured(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function getProviderDefaults(provider: SaveLLMConfigInput['provider']) {
  switch (provider) {
    case 'anthropic':
      return {
        chatModel: 'claude-3-7-sonnet-latest',
        embeddingModel: 'text-embedding-3-small',
      };
    case 'ollama':
      return {
        chatModel: 'llama3.2',
        embeddingModel: 'nomic-embed-text',
      };
    case 'openai':
    default:
      return {
        chatModel: 'gpt-4o-mini',
        embeddingModel: 'text-embedding-3-small',
      };
  }
}

function mapConfigToForm(config: LLMConfigPublicView): SaveLLMConfigInput {
  return {
    provider: config.provider,
    chatModel: config.chatModel,
    embeddingModel: config.embeddingModel,
    apiKey: '',
    baseUrl: config.baseUrl ?? '',
  };
}

export function LlmSettingsPage() {
  const { data, error, isLoading } = useLLMConfig();
  const saveConfig = useSaveLLMConfig();
  const validateConfig = useValidateLLMConfig();
  const deleteConfig = useDeleteLLMConfig();
  const [form, setForm] = useState<SaveLLMConfigInput>(DEFAULT_FORM);
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);

  const missingConfig = isNotConfigured(error);
  const fatalError = error && !missingConfig ? (error as Error) : null;

  useEffect(() => {
    if (data) {
      setForm(mapConfigToForm(data));
      setFeedback(null);
      return;
    }

    if (missingConfig) {
      setForm(DEFAULT_FORM);
      setFeedback(null);
    }
  }, [data, missingConfig]);

  const capabilities = useMemo(
    () =>
      data
        ? [
            data.capabilities.chat ? 'Chat ready' : 'Chat unavailable',
            data.capabilities.embeddings
              ? 'Embeddings ready'
              : 'Embeddings unavailable',
          ]
        : [],
    [data],
  );

  function updateForm<K extends keyof SaveLLMConfigInput>(
    key: K,
    value: SaveLLMConfigInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleProviderChange(provider: SaveLLMConfigInput['provider']) {
    const defaults = getProviderDefaults(provider);
    setForm((current) => ({
      ...current,
      provider,
      chatModel: current.chatModel ? current.chatModel : defaults.chatModel,
      embeddingModel: current.embeddingModel
        ? current.embeddingModel
        : defaults.embeddingModel,
      baseUrl:
        provider === 'ollama'
          ? current.baseUrl || 'http://localhost:11434'
          : current.baseUrl,
    }));
  }

  async function handleSave() {
    setFeedback(null);

    try {
      const saved = await saveConfig.mutateAsync({
        ...form,
        apiKey: form.apiKey?.trim() || undefined,
        baseUrl: form.baseUrl?.trim() || undefined,
      });

      setForm(mapConfigToForm(saved));
      setFeedback({
        message: 'LLM configuration saved successfully.',
        tone: 'success',
      });
    } catch (saveError) {
      setFeedback({
        message:
          saveError instanceof Error
            ? saveError.message
            : 'Failed to save configuration.',
        tone: 'error',
      });
    }
  }

  async function handleValidate() {
    setFeedback(null);

    try {
      const validated = await validateConfig.mutateAsync({
        ...form,
        apiKey: form.apiKey?.trim() || undefined,
        baseUrl: form.baseUrl?.trim() || undefined,
      });

      setFeedback({
        message: `Validation passed for ${validated.provider}.`,
        tone: 'success',
      });
    } catch (validateError) {
      setFeedback({
        message:
          validateError instanceof Error
            ? validateError.message
            : 'Validation failed.',
        tone: 'error',
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/app/settings" />}
          className="rounded-xl"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">LLM Config</h1>
          <p className="text-muted-foreground">
            Choose the provider and model defaults that power AI search,
            summaries, and graph generation.
          </p>
        </div>
      </header>
      <div className="mt-4 space-y-4">
        {fatalError ? (
          <Alert variant="error">
            <AlertTitle>Configuration unavailable</AlertTitle>
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Provider settings</CardTitle>
              <CardDescription>
                Save one configuration that the app can use across AI-powered
                features.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Provider</FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      handleProviderChange(
                        value as SaveLLMConfigInput['provider'],
                      )
                    }
                    value={form.provider}
                  >
                    <SelectTrigger>
                      <SelectValue>{form.provider}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Pick the provider your backend should use for chat and
                    embeddings.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="llm-base-url">Base URL</FieldLabel>
                  <Input
                    id="llm-base-url"
                    onChange={(event) =>
                      updateForm('baseUrl', event.target.value)
                    }
                    placeholder="Optional custom endpoint"
                    value={form.baseUrl ?? ''}
                  />
                  <FieldDescription>
                    Useful for proxies or local Ollama endpoints.
                  </FieldDescription>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="llm-chat-model">Chat model</FieldLabel>
                  <Input
                    id="llm-chat-model"
                    onChange={(event) =>
                      updateForm('chatModel', event.target.value)
                    }
                    placeholder="gpt-4o-mini"
                    value={form.chatModel}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="llm-embedding-model">
                    Embedding model
                  </FieldLabel>
                  <Input
                    id="llm-embedding-model"
                    onChange={(event) =>
                      updateForm('embeddingModel', event.target.value)
                    }
                    placeholder="text-embedding-3-small"
                    value={form.embeddingModel}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="llm-api-key">API key</FieldLabel>
                <Input
                  id="llm-api-key"
                  onChange={(event) => updateForm('apiKey', event.target.value)}
                  placeholder="Leave blank to keep the current encrypted key"
                  type="password"
                  value={form.apiKey ?? ''}
                />
                <FieldDescription>
                  The API key is only needed when you want to set or replace the
                  saved credential.
                </FieldDescription>
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={saveConfig.isPending}
                  onClick={() => void handleSave()}
                >
                  <Bot className="size-4" />
                  {saveConfig.isPending
                    ? 'Saving...'
                    : data
                      ? 'Save changes'
                      : 'Save config'}
                </Button>
                <Button
                  disabled={validateConfig.isPending}
                  onClick={() => void handleValidate()}
                  variant="outline"
                >
                  <CheckCircle2 className="size-4" />
                  {validateConfig.isPending ? 'Validating...' : 'Validate'}
                </Button>
                {data ? (
                  <ConfirmationDialog
                    confirmLabel="Delete config"
                    description="This removes the saved provider configuration from the backend."
                    isPending={deleteConfig.isPending}
                    onConfirm={() => deleteConfig.mutateAsync()}
                    title="Delete saved LLM configuration?"
                    tone="destructive"
                    trigger={
                      <Button variant="destructive-outline">
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    }
                  />
                ) : null}
              </div>
            </CardPanel>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current status</CardTitle>
                <CardDescription>
                  What the backend currently knows about your AI runtime
                  configuration.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </>
                ) : null}

                {!isLoading && !data ? (
                  <Empty className="min-h-0 rounded-xl border border-dashed border-border/70 px-4 py-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Bot className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No config saved</EmptyTitle>
                      <EmptyDescription>
                        Save a provider and model setup to enable AI features
                        reliably.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : null}

                {data ? (
                  <>
                    <div className="rounded-xl border border-border/60 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {data.provider}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Models</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {data.chatModel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Embeddings: {data.embeddingModel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Capabilities
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {capabilities.map((item) => (
                          <Badge key={item} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Validation
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-sm font-medium',
                          data.validatedAt
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {data.validatedAt
                          ? `Validated at ${new Date(data.validatedAt).toLocaleString()}`
                          : 'Not validated yet'}
                      </p>
                    </div>
                  </>
                ) : null}
              </CardPanel>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Where this is used</CardTitle>
                <CardDescription>
                  These settings feed the AI features already built into the
                  app.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-3">
                {[
                  {
                    icon: Bot,
                    title: 'Search & Ask',
                    text: 'Grounded answers and conversation follow-ups.',
                  },
                  {
                    icon: Cpu,
                    title: 'Summaries',
                    text: 'Document summary generation and AI transforms.',
                  },
                  {
                    icon: KeyRound,
                    title: 'Knowledge Graph',
                    text: 'Entity extraction and graph-related AI tasks.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3"
                  >
                    <div className="rounded-lg border border-border/60 bg-muted/35 p-2">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {title}
                      </p>
                      <p className="text-xs text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </CardPanel>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Bot, Cpu, KeyRound, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import type { UpdateLLMConfigRequest, LLMProvider } from '@repo/types';
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
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldError,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/lib/api';
import { useLLMConfig, useUpdateLLMConfig, useTestLLMConfig } from '../hooks';
import { PageContainer } from '@/features/workspace/components/page-container';

const llmSettingsSchema = z.object({
  useSystemDefault: z.boolean(),
  providerId: z.string().min(1, 'Provider is required'),
  modelId: z.string().min(1, 'Model is required'),
  embeddingModelId: z.string().optional(),
  apiKey: z.string().optional(),
});

type LlmSettingsFormValues = z.infer<typeof llmSettingsSchema>;

export function LlmSettingsPage() {
  const { data, error, isLoading } = useLLMConfig();
  const updateConfig = useUpdateLLMConfig();
  const testConfig = useTestLLMConfig();

  const [feedback, setFeedback] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);

  const form = useForm<LlmSettingsFormValues>({
    resolver: zodResolver(llmSettingsSchema),
    defaultValues: {
      useSystemDefault: true,
      providerId: '',
      modelId: '',
      embeddingModelId: '',
      apiKey: '',
    },
  });

  const registry = useMemo(() => data?.registry || [], [data]);
  const activeConfig = useMemo(() => {
    if (!data?.configs?.length) return null;
    if (data.activeConfigId) {
      return (
        data.configs.find((c) => c.id === data.activeConfigId) ||
        data.configs[0]
      );
    }
    return data.configs[0];
  }, [data]);

  useEffect(() => {
    if (activeConfig) {
      form.reset({
        useSystemDefault: activeConfig.useSystemDefault,
        providerId: activeConfig.providerId,
        modelId: activeConfig.modelId,
        embeddingModelId: activeConfig.embeddingModelId || '',
        apiKey: '',
      });
    }
  }, [activeConfig, form]);

  const watchedProviderId = form.watch('providerId');
  const watchedUseSystemDefault = form.watch('useSystemDefault');

  const selectedProvider = useMemo(
    () => registry.find((p: LLMProvider) => p.id === watchedProviderId),
    [registry, watchedProviderId],
  );

  const handleProviderChange = (value: string | null) => {
    if (!value) return;
    form.setValue('providerId', value);
    const provider = registry.find((p: LLMProvider) => p.id === value);
    if (provider) {
      form.setValue('modelId', provider.defaultModel);
    }
  };

  const onSubmit = async (values: LlmSettingsFormValues) => {
    setFeedback(null);
    try {
      await updateConfig.mutateAsync({
        ...values,
        id: activeConfig?.id,
      } as UpdateLLMConfigRequest);
      setFeedback({
        message: 'LLM configuration updated successfully.',
        tone: 'success',
      });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        err.details.forEach((detail) => {
          form.setError(detail.field as keyof LlmSettingsFormValues, {
            message: detail.messages[0],
          });
        });
      }
      setFeedback({
        message:
          err instanceof Error ? err.message : 'Failed to update configuration',
        tone: 'error',
      });
    }
  };

  const handleTest = async () => {
    const values = form.getValues();
    setFeedback(null);
    try {
      const response = await testConfig.mutateAsync({
        providerId: values.providerId,
        modelId: values.modelId,
        apiKey: values.apiKey,
        useSystemDefault: values.useSystemDefault,
      });

      if (response.success) {
        setFeedback({
          message: `Connection successful! Response: ${response.response || 'No content'}`,
          tone: 'success',
        });
      } else {
        setFeedback({
          message: response.message || 'Connection failed',
          tone: 'error',
        });
      }
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : 'Test failed',
        tone: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer className="space-y-8">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
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
          <h1 className="text-3xl font-bold tracking-tight">LLM Config</h1>
          <p className="text-muted-foreground">
            Choose the provider and model defaults that power AI features.
          </p>
        </div>
      </header>

      <div className="mt-4 space-y-4">
        {error ? (
          <Alert variant="error">
            <AlertTitle>Error loading configuration</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
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
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Provider settings</CardTitle>
                <CardDescription>
                  Configure which LLM provider to use for your requests.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-6">
                <Field className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-4 py-3">
                  <div className="space-y-0.5">
                    <FieldLabel>Use system defaults</FieldLabel>
                    <FieldDescription>
                      Enable this to use the platform&apos;s recommended models
                      (zero config needed).
                    </FieldDescription>
                  </div>
                  <Controller
                    name="useSystemDefault"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </Field>

                {!watchedUseSystemDefault && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel>Provider</FieldLabel>
                        <Controller
                          name="providerId"
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={handleProviderChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                              <SelectContent>
                                {registry.map((p: LLMProvider) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.providerId && (
                          <FieldError>
                            {form.formState.errors.providerId.message}
                          </FieldError>
                        )}
                      </Field>

                      <Field>
                        <FieldLabel>Model</FieldLabel>
                        <Controller
                          name="modelId"
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!selectedProvider}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedProvider?.models.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} {m.free && '(Free)'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.modelId && (
                          <FieldError>
                            {form.formState.errors.modelId.message}
                          </FieldError>
                        )}
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="llm-api-key">API Key</FieldLabel>
                      <Input
                        id="llm-api-key"
                        type="password"
                        placeholder={
                          activeConfig?.hasApiKey
                            ? '••••••••••••••••'
                            : 'Enter API key'
                        }
                        {...form.register('apiKey')}
                      />
                      <FieldDescription>
                        Your API key is encrypted and stored securely.
                      </FieldDescription>
                      {form.formState.errors.apiKey && (
                        <FieldError>
                          {form.formState.errors.apiKey.message}
                        </FieldError>
                      )}
                    </Field>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={updateConfig.isPending}>
                    <Bot className="size-4" />
                    {updateConfig.isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={testConfig.isPending}
                    onClick={() => void handleTest()}
                  >
                    <Zap className="size-4" />
                    {testConfig.isPending ? 'Testing...' : 'Test connection'}
                  </Button>
                </div>
              </CardPanel>
            </form>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current status</CardTitle>
                <CardDescription>
                  Active AI runtime configuration.
                </CardDescription>
              </CardHeader>
              <CardPanel className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Shield className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {watchedUseSystemDefault
                          ? 'System Managed'
                          : 'User Configured'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {watchedUseSystemDefault
                          ? 'Using platform defaults'
                          : 'Using personal API key'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Current Model
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {activeConfig
                      ? `${activeConfig.providerId} / ${activeConfig.modelId}`
                      : 'System Default'}
                  </p>
                </div>

                {activeConfig && (
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Capabilities
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">Chat</Badge>
                      <Badge variant="secondary">Summarization</Badge>
                      <Badge variant="secondary">Embeddings</Badge>
                    </div>
                  </div>
                )}
              </CardPanel>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
              </CardHeader>
              <CardPanel className="space-y-3">
                {[
                  {
                    icon: Bot,
                    title: 'AI Chat',
                    text: 'Real-time conversation',
                  },
                  {
                    icon: Cpu,
                    title: 'Processing',
                    text: 'Summaries & extraction',
                  },
                  {
                    icon: KeyRound,
                    title: 'Security',
                    text: 'Encrypted storage',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-center gap-3 p-1">
                    <Icon className="size-4 text-muted-foreground" />
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
    </PageContainer>
  );
}

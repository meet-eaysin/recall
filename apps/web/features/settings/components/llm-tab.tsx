'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, Zap, KeyRound } from 'lucide-react';
import type { UpdateLLMConfigRequest, LLMProvider } from '@repo/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLLMConfig, useUpdateLLMConfig, useTestLLMConfig } from '../hooks';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const llmSettingsSchema = z.object({
  useSystemDefault: z.boolean(),
  providerId: z.string().min(1, 'Provider is required'),
  modelId: z.string().min(1, 'Model is required'),
  embeddingModelId: z.string().optional(),
  apiKey: z.string().optional(),
});

type LlmSettingsFormValues = z.infer<typeof llmSettingsSchema>;

export function LlmTab() {
  const { data, isLoading } = useLLMConfig();
  const updateConfig = useUpdateLLMConfig();
  const testConfig = useTestLLMConfig();

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
    return (
      data.configs.find((c) => c.id === data.activeConfigId) || data.configs[0]
    );
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

  const handleProviderChange = (value: string) => {
    form.setValue('providerId', value);
    const provider = registry.find((p: LLMProvider) => p.id === value);
    if (provider) {
      form.setValue('modelId', provider.defaultModel);
    }
  };

  const onSubmit = async (values: LlmSettingsFormValues) => {
    try {
      await updateConfig.mutateAsync({
        ...values,
        id: activeConfig?.id,
      } as UpdateLLMConfigRequest);
      toast.success('LLM configuration updated');
    } catch (_err) {
      toast.error('Failed to update LLM configuration');
    }
  };

  const handleTest = async () => {
    const values = form.getValues();
    try {
      const response = await testConfig.mutateAsync({
        providerId: values.providerId,
        modelId: values.modelId,
        apiKey: values.apiKey,
        useSystemDefault: values.useSystemDefault,
      });

      if (response.success) {
        toast.success(`Connection successful!`);
      } else {
        toast.error(response.message || 'Connection failed');
      }
    } catch (_err) {
      toast.error('Test failed');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>AI Provider Configuration</CardTitle>
            <CardDescription>
              Configure the models and providers that power your AI features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10">
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">Use system defaults</p>
                <p className="text-xs text-muted-foreground">
                  Enable platform-recommended models automatically.
                </p>
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
            </div>

            {!watchedUseSystemDefault && (
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provider</label>
                    <Controller
                      name="providerId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={handleProviderChange}
                        >
                          <SelectTrigger className="rounded-lg shadow-sm">
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
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <Controller
                      name="modelId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!selectedProvider}
                        >
                          <SelectTrigger className="rounded-lg shadow-sm">
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
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="relative">
                    <Input
                      type="password"
                      className="pr-10 rounded-lg shadow-sm"
                      placeholder={
                        activeConfig?.hasApiKey
                          ? '••••••••••••••••'
                          : 'Enter your API key'
                      }
                      {...form.register('apiKey')}
                    />
                    <KeyRound className="absolute right-3 top-2.5 size-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your key is encrypted before storage.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <Button
                type="submit"
                disabled={updateConfig.isPending}
                className="rounded-lg shadow-sm"
              >
                <Bot className="size-4 mr-2" />
                {updateConfig.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={testConfig.isPending}
                onClick={handleTest}
                className="rounded-lg shadow-sm"
              >
                <Zap className="size-4 mr-2" />
                {testConfig.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

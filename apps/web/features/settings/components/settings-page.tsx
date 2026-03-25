'use client';

import { useMemo } from 'react';
import { Bot, ShieldCheck, UserCircle2, Workflow } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/features/workspace/components/page-container';
import { ProfileForm } from './profile-form';
import { SecurityTab } from './security-tab';
import { LlmTab } from './llm-tab';
import { NotionTab } from './notion-tab';
import { useCurrentUser, useUserSessions, useLLMConfig, useNotionConfig } from '../hooks';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SettingsPage() {
  const { data: user } = useCurrentUser();
  const { data: sessions } = useUserSessions();
  const { data: llmConfig } = useLLMConfig();
  const { data: notionConfig } = useNotionConfig();

  const activeConfig = useMemo(() => {
    if (!llmConfig?.configs?.length) return null;
    return llmConfig.configs.find((c) => c.id === llmConfig.activeConfigId) || llmConfig.configs[0];
  }, [llmConfig]);

  return (
    <PageContainer className="max-w-6xl mx-auto space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your account preferences, security settings, and AI integrations.
        </p>
      </div>

      <Tabs defaultValue="account" orientation="vertical" className="flex flex-col md:flex-row gap-8 min-h-[600px]">
        <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1 min-w-[240px] items-stretch justify-start border-r pr-6 border-border/40">
          <TabsTrigger 
            value="account" 
            className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all rounded-xl border border-transparent hover:border-border/50"
          >
            <UserCircle2 className="size-5" />
            <div className="flex flex-col items-start transition-none">
              <span className="font-semibold">Account</span>
              <span className="text-xs text-muted-foreground font-normal">Personal information & profile</span>
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="security" 
            className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all rounded-xl border border-transparent hover:border-border/50"
          >
            <ShieldCheck className="size-5" />
            <div className="flex flex-col items-start transition-none">
              <span className="font-semibold">Security</span>
              <span className="text-xs text-muted-foreground font-normal">Active sessions & protection</span>
            </div>
            {sessions && sessions.length > 1 && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-4.5">{sessions.length}</Badge>
            )}
          </TabsTrigger>

          <TabsTrigger 
            value="ai" 
            className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all rounded-xl border border-transparent hover:border-border/50"
          >
            <Bot className="size-5" />
            <div className="flex flex-col items-start transition-none">
              <span className="font-semibold">AI Console</span>
              <span className="text-xs text-muted-foreground font-normal">LLM providers & models</span>
            </div>
            {activeConfig && <Badge variant="outline" className="ml-auto text-[10px] px-1.5 h-4.5">{activeConfig.providerId}</Badge>}
          </TabsTrigger>

          <TabsTrigger 
            value="integrations" 
            className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all rounded-xl border border-transparent hover:border-border/50"
          >
            <Workflow className="size-5" />
            <div className="flex flex-col items-start transition-none">
              <span className="font-semibold">Integrations</span>
              <span className="text-xs text-muted-foreground font-normal">Connect third-party apps</span>
            </div>
            {notionConfig && <Badge variant="outline" className="ml-auto text-[10px] px-1.5 h-4.5">Notion</Badge>}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 space-y-6">
          <TabsContent value="account" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-8">
                <div className="flex items-center gap-6">
                  <Avatar className="size-20 border-4 border-background shadow-lg">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{user?.name || 'Unnamed user'}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">{user?.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <ProfileForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="m-0 animate-in fade-in slide-in-from-right-2 duration-300">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="ai" className="m-0 animate-in fade-in slide-in-from-right-2 duration-300">
            <LlmTab />
          </TabsContent>

          <TabsContent value="integrations" className="m-0 animate-in fade-in slide-in-from-right-2 duration-300">
            <NotionTab />
          </TabsContent>
        </div>
      </Tabs>
    </PageContainer>
  );
}

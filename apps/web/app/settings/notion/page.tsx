import { FeatureShellPage } from '@/components/shell/feature-shell-page';

export default function NotionSettingsPage() {
  return (
    <FeatureShellPage
      title="Notion"
      subtitle="Workspace sync"
      description="Connect Notion, inspect available databases, choose sync direction, and manage the integration lifecycle."
      endpoints={[
        'GET /notion/config',
        'POST /notion/connect',
        'GET /notion/databases',
        'PATCH /notion/config',
        'POST /notion/sync',
        'DELETE /notion/disconnect',
      ]}
    />
  );
}

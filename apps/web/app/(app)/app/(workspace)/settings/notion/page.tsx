import { NotionSettingsPage } from '@/features/settings/components/notion-settings-page';
import { PageContainer } from '@/features/workspace/components/page-container';

export default function AppNotionPage() {
  return (
    <PageContainer>
      <NotionSettingsPage />
    </PageContainer>
  );
}

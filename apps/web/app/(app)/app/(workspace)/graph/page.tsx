import { GraphExplorerClient } from '@/features/graph/components/graph-explorer.client';
import { PageContainer } from '@/features/workspace/components/page-container';

export default function AppGraphPage() {
  return (
    <PageContainer>
      <GraphExplorerClient />
    </PageContainer>
  );
}

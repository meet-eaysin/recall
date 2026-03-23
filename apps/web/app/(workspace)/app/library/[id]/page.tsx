import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import { PageContainer } from '@/features/workspace/components/page-container';

export default async function AppLibraryDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageContainer>
      <DocumentDetailView id={id} />
    </PageContainer>
  );
}

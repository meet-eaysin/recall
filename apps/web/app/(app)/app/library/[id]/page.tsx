import Shell from '@/components/shell';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';

export default async function AppLibraryDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell>
      <DocumentDetailView id={id} />
    </Shell>
  );
}

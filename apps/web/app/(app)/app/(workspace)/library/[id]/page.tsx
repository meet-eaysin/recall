import { DocumentDetailView } from '@/features/library/components/document-detail-view';

export default async function AppLibraryDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <DocumentDetailView id={id} />
    </div>
  );
}

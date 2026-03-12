import { LibraryFeed } from '@/features/library/components/library-feed';
import { AddDocumentDialog } from '@/features/library/components/add-document-dialog';
import { PageContainer } from '@/features/workspace/components/page-container';

export default function AppLibraryPage() {
  return (
    <PageContainer className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground">Manage and organize your synchronized knowledge base.</p>
        </div>
        <AddDocumentDialog />
      </header>

      <div className="mt-8">
        <LibraryFeed />
      </div>
    </PageContainer>
  );
}

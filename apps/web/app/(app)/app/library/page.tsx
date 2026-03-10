import Shell from '@/components/shell';
import { LibraryFeed } from '@/features/library/components/library-feed';
import { AddDocumentDialog } from '@/features/library/components/add-document-dialog';

export default function AppLibraryPage() {
  return (
    <Shell
      heading="Library"
      subtitle="Manage your documents"
      CTA={<AddDocumentDialog />}
    >
      <div className="mt-4">
        <LibraryFeed />
      </div>
    </Shell>
  );
}

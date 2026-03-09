import { LibraryFeed } from '@/features/library/components/library-feed';
import { AddDocumentDialog } from '@/features/library/components/add-document-dialog';
import Shell from '@/components/shell';

export default function DocumentsPage() {
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

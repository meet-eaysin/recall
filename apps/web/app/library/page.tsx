import { LibraryFeed } from '@/features/library/components/library-feed';
import { AddDocumentDialog } from '@/features/library/components/add-document-dialog';
import { FolderCreateDialog } from '@/features/library/components/folder-create-dialog';
import Shell from '@/components/shell';

export default function DocumentsPage() {
  return (
    <Shell
      heading="Library"
      beforeCTAactions={<FolderCreateDialog />}
      CTA={<AddDocumentDialog />}
    >
      <div className="mt-4">
        <LibraryFeed />
      </div>
    </Shell>
  );
}

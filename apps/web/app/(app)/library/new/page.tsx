import { FeatureShellPage } from '@/components/shell/feature-shell-page';
import { AddDocumentForm } from '@/features/library/components/add-document-form';

export default function AppLibraryNewPage() {
  return (
    <FeatureShellPage
      title="Add to Library"
      subtitle="Save a new link or document"
      description="Input a URL to save for later, or manually create a knowledge note. Type @ in the notes field to mention other documents."
      endpoints={['POST /documents']}
    >
      <AddDocumentForm />
    </FeatureShellPage>
  );
}

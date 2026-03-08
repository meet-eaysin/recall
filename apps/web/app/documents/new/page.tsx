import { FeatureShellPage } from '@/components/app/feature-shell-page';
import { AddDocumentForm } from '@/features/library/components/add-document-form';

export default function NewDocumentPage() {
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

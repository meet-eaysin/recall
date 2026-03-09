import { FeatureShellPage } from '@/components/shell/feature-shell-page';

export default function Page() {
  return (
    <FeatureShellPage
      title="Home"
      subtitle="Mind Stack overview"
      description="This is the starting point for your personal knowledge system. Use the sidebar to access document ingestion, knowledge organization, AI search, graph, review, analytics, and integrations."
      ctaLabel="Add Document"
      ctaHref="/library/new"
      endpoints={['GET /health']}
    />
  );
}

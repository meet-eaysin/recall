import { FeatureShellPage } from '@/components/shell/feature-shell-page';

export default function Page() {
  return (
    <FeatureShellPage
      title="Home"
      subtitle="Daily overview"
      description="This page is the daily-use surface for your personal knowledge system, where review, current activity, and other always-needed items live together."
      ctaLabel="Add Document"
      ctaHref="/library/new"
      endpoints={[
        'GET /analytics/stats',
        'GET /review/daily',
        'GET /analytics/heatmap',
      ]}
    />
  );
}

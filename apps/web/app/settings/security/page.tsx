import { FeatureShellPage } from '@/components/shell/feature-shell-page';

export default function SecuritySettingsPage() {
  return (
    <FeatureShellPage
      title="Security"
      subtitle="Password and account protection"
      description="Update your password and manage the security settings for your personal knowledge workspace."
      endpoints={['PATCH /auth/me/password']}
    />
  );
}

import Shell from '@/components/shell';

export default function Page() {
  return (
    <Shell
      heading={<>Event Types Mock</>}
      subtitle="Create and manage your event types"
      CTA={
        <button className="bg-brand text-brand-contrast px-4 py-2 rounded-md font-medium text-sm">
          New Event Type
        </button>
      }
    >
      <div className="bg-default border-subtle border rounded-md p-6 mt-6">
        <h2 className="text-emphasis font-semibold text-lg mb-2">
          Example Content Area
        </h2>
        <p className="text-subtle text-sm">
          This is a purely visual demonstration of the Cal.com shell layout. All
          backend routing, authentication, and data-fetching has been stripped
          away.
        </p>
      </div>
    </Shell>
  );
}

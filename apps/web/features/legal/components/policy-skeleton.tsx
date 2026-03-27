import { Skeleton } from '@/components/ui/skeleton';

export function PolicySkeleton() {
  return (
    <div className="px-3 pt-32 pb-12 sm:px-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl px-4 space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>

        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

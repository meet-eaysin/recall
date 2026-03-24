'use client';
import { cn } from '@/lib/utils';
import FrameworkCard from './frameworkcard';

const FeatureFramework = () => {
  return (
    <div
      className={cn(
        'relative',
        'flex flex-col justify-between',
        'h-80 space-y-4',
        'rounded-md border border-neutral-800/50 bg-neutral-950',
      )}
    >
      <FrameworkCard />
      <div className="px-4 pb-4">
        <div className="text-sm font-semibold text-white">
          Developer First
        </div>
        <div className="mt-2 text-xs text-neutral-400">
          Built on a robust stack of Postgres, Chroma, and Redis. Recall
          seamlessly integrates into your existing developer workflow.
        </div>
      </div>
    </div>
  );
};

export default FeatureFramework;

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from '@/components/ui/empty';

interface PolicyErrorProps {
  error: string;
  onRetry: () => void;
}

export function PolicyError({ error, onRetry }: PolicyErrorProps) {
  return (
    <div className="px-3 pt-48 pb-24 sm:px-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-7xl px-4">
        <Empty className="border-none bg-transparent">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="bg-destructive/10 text-destructive border-destructive/20"
            >
              <AlertCircle className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-xl">Something went wrong</EmptyTitle>
            <EmptyDescription className="max-w-xs mx-auto">
              {error ||
                "We couldn't load the policy at this time. Please check your connection and try again."}
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent className="mt-2 text-center">
            <Button onClick={onRetry} variant="outline" className="mx-auto">
              <RefreshCw className="size-3.5" />
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  );
}

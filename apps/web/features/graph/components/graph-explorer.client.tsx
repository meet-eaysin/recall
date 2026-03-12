'use client';

import dynamic from 'next/dynamic';

const GraphExplorer = dynamic(
  () =>
    import('@/features/graph/components/graph-explorer').then(
      (mod) => mod.GraphExplorer,
    ),
  { ssr: false },
);

export function GraphExplorerClient() {
  return <GraphExplorer />;
}

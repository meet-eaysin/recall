'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeToolbar,
  Handle,
  Position,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useOnSelectionChange,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type ColorMode,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  BrainCircuit,
  GitBranch,
  Loader2,
  RefreshCcw,
  ExternalLink,
  Network,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { GraphNodeType, GraphRelationType } from '@repo/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useDocumentSubgraph,
  useFullGraph,
  useRebuildDocumentGraph,
} from '../hooks';
import type { FullGraphData } from '../types';
import { PageContainer } from '@/features/workspace/components/page-container';

type KGNodeData = {
  label: string;
  nodeType: GraphNodeType;
  documentId?: string;
  isFocused: boolean;
  connectionCount: number;
};

type KGNode = Node<KGNodeData>;

type KGEdgeData = {
  relationType: GraphRelationType;
  weight: number;
};

type KGEdge = Edge<KGEdgeData>;

const EDGE_COLORS: Record<GraphRelationType, string> = {
  [GraphRelationType.ROOT_CONNECTION]: '#94a3b8',
  [GraphRelationType.SEMANTIC_SIMILARITY]: '#2dd4bf',
  [GraphRelationType.SHARED_TAGS]: '#60a5fa',
  [GraphRelationType.TOPICAL]: '#a78bfa',
};

const RELATION_LABELS: Record<GraphRelationType, string> = {
  [GraphRelationType.ROOT_CONNECTION]: 'Root connection',
  [GraphRelationType.SEMANTIC_SIMILARITY]: 'Semantic similarity',
  [GraphRelationType.SHARED_TAGS]: 'Shared tags',
  [GraphRelationType.TOPICAL]: 'Topical',
};

function getEdgeColor(type: GraphRelationType): string {
  return EDGE_COLORS[type] ?? '#94a3b8';
}

function getRelationLabel(type: GraphRelationType): string {
  return RELATION_LABELS[type] ?? String(type);
}

function radialLayout(graph: FullGraphData) {
  const rootId = graph.rootNodeId;
  const others = graph.nodes.filter((n) => n.id !== rootId);
  const positions: { id: string; x: number; y: number }[] = [];

  const rootNode = graph.nodes.find((n) => n.id === rootId);
  if (rootNode) positions.push({ id: rootNode.id, x: 0, y: 0 });

  let remaining = others.length;
  let placed = 0;
  let ring = 0;

  while (remaining > 0) {
    const capacity = Math.min(remaining, 6 + ring * 6);
    const radius = 260 + ring * 220;
    for (let i = 0; i < capacity; i++) {
      const node = others[placed + i];
      if (!node) continue;
      const angle = -Math.PI / 2 + (i / capacity) * Math.PI * 2;
      positions.push({
        id: node.id,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
    placed += capacity;
    remaining -= capacity;
    ring++;
  }

  return positions;
}

function buildFlowData(
  graph: FullGraphData,
  focusedDocumentId: string | null,
): { nodes: KGNode[]; edges: KGEdge[] } {
  const posMap = new Map(radialLayout(graph).map((p) => [p.id, p]));

  const connectionCount = new Map<string, number>();
  for (const edge of graph.edges) {
    connectionCount.set(
      edge.fromNodeId,
      (connectionCount.get(edge.fromNodeId) ?? 0) + 1,
    );
    connectionCount.set(
      edge.toNodeId,
      (connectionCount.get(edge.toNodeId) ?? 0) + 1,
    );
  }

  const nodes: KGNode[] = graph.nodes.map((n) => {
    const pos = posMap.get(n.id) ?? { x: 0, y: 0 };
    const isRoot = n.type === GraphNodeType.ROOT;
    const isFocused = n.documentId === focusedDocumentId;

    return {
      id: n.id,
      type: isRoot
        ? 'rootNode'
        : n.type === GraphNodeType.CONCEPT
          ? 'conceptNode'
          : 'documentNode',
      position: { x: pos.x, y: pos.y },
      data: {
        label: n.label,
        nodeType: n.type as GraphNodeType,
        documentId: n.documentId,
        isFocused,
        connectionCount: connectionCount.get(n.id) ?? 0,
      },
      selectable: true,
      draggable: true,
    };
  });

  const edges: KGEdge[] = graph.edges.map((e) => {
    const color = getEdgeColor(e.relationType);
    return {
      id: e.id,
      source: e.fromNodeId,
      target: e.toNodeId,
      type: 'kgEdge',
      data: { relationType: e.relationType, weight: e.weight },
      style: {
        stroke: color,
        strokeWidth: Math.max(1.5, e.weight * 3),
        strokeOpacity: 0.7,
      },
      animated: e.relationType === GraphRelationType.SEMANTIC_SIMILARITY,
    };
  });

  return { nodes, edges };
}

function KGHandles() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 4, height: 4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 4, height: 4 }}
      />
    </>
  );
}

function RootNode({ data, selected }: NodeProps<KGNode>) {
  const d = data as KGNodeData;
  return (
    <div className="flex flex-col items-center gap-2">
      <NodeToolbar isVisible={selected} position={Position.Top} offset={14}>
        <div className="flex items-center gap-1.5 rounded-lg border bg-popover/95 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-lg">
          <BrainCircuit className="size-3 text-primary" />
          Knowledge Root · {d.connectionCount} links
        </div>
      </NodeToolbar>

      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-md transition-all duration-200',
          selected
            ? 'border-primary bg-primary scale-110 shadow-lg'
            : 'border-primary/50 bg-primary/90 hover:scale-105 hover:border-primary',
        )}
      >
        <BrainCircuit className="size-6 text-primary-foreground" />
      </div>

      <span className="max-w-[120px] truncate text-center text-[9px] font-bold tracking-widest text-muted-foreground">
        {d.label}
      </span>
      <KGHandles />
    </div>
  );
}

function DocumentNode({ data, selected }: NodeProps<KGNode>) {
  const d = data as KGNodeData;
  return (
    <div
      className={cn(
        'relative min-w-[130px] max-w-[168px] rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-all duration-200',
        d.isFocused
          ? 'border-primary/60 ring-2 ring-primary/20 shadow-md'
          : selected
            ? 'border-border shadow-md scale-[1.04]'
            : 'border-border/60 hover:border-border hover:shadow-md hover:scale-[1.02]',
      )}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={8}>
        <div className="flex items-center gap-1.5 rounded-lg border bg-popover/95 backdrop-blur-sm px-2.5 py-1 text-xs text-popover-foreground shadow-lg">
          {d.connectionCount} connections
          {d.documentId && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              doc
            </Badge>
          )}
        </div>
      </NodeToolbar>

      <div className="mb-1.5 flex items-center gap-1.5">
        <div
          className="size-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor: d.isFocused
              ? EDGE_COLORS[GraphRelationType.TOPICAL]
              : EDGE_COLORS[GraphRelationType.SHARED_TAGS],
          }}
        />
        <span className="text-[9px] font-bold text-muted-foreground">
          Document
        </span>
      </div>
      <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
        {d.label}
      </p>
      <KGHandles />
    </div>
  );
}

function ConceptNode({ data, selected }: NodeProps<KGNode>) {
  const d = data as KGNodeData;
  return (
    <div
      className={cn(
        'relative min-w-[100px] max-w-[145px] rounded-lg border bg-card/80 px-2.5 py-2 shadow-sm transition-all duration-200',
        selected
          ? 'border-teal-500/50 ring-1 ring-teal-500/20 scale-[1.04] shadow-md'
          : 'border-border/50 hover:border-border hover:scale-[1.02]',
      )}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={8}>
        <div className="rounded-lg border bg-popover/95 backdrop-blur-sm px-2.5 py-1 text-xs text-popover-foreground shadow-lg">
          Concept · {d.connectionCount} connections
        </div>
      </NodeToolbar>

      <div className="mb-0.5 flex items-center gap-1">
        <div
          className="size-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor: EDGE_COLORS[GraphRelationType.SEMANTIC_SIMILARITY],
          }}
        />
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: EDGE_COLORS[GraphRelationType.SEMANTIC_SIMILARITY] }}
        >
          Concept
        </span>
      </div>
      <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
        {d.label}
      </p>
      <KGHandles />
    </div>
  );
}

function KGEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
  markerEnd,
}: EdgeProps<KGEdge>) {
  const d = data as KGEdgeData;
  const color = getEdgeColor(d.relationType);
  const baseWidth = Math.max(1.5, d.weight * 3);

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const sourcePos =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? Position.Right
        : Position.Left
      : dy > 0
        ? Position.Bottom
        : Position.Top;
  const targetPos =
    sourcePos === Position.Right
      ? Position.Left
      : sourcePos === Position.Left
        ? Position.Right
        : sourcePos === Position.Top
          ? Position.Bottom
          : Position.Top;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePos,
    targetX,
    targetY,
    targetPosition: targetPos,
    curvature: 0.2,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected ? baseWidth * 1.8 : baseWidth,
          strokeOpacity: selected ? 1 : 0.65,
          transition: 'stroke-width 0.15s ease, stroke-opacity 0.15s ease',
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute"
            style={{
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <div
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              {getRelationLabel(d.relationType)} · {d.weight.toFixed(2)}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = {
  rootNode: RootNode,
  documentNode: DocumentNode,
  conceptNode: ConceptNode,
} as const;

const edgeTypes = { kgEdge: KGEdge } as const;

type InnerFlowProps = {
  graph: FullGraphData | null;
  focusedDocumentId: string | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  colorMode: ColorMode;
};

function InnerFlow({
  graph,
  focusedDocumentId,
  selectedNodeId,
  onSelectNode,
  colorMode,
}: InnerFlowProps) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<KGNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<KGEdge>([]);

  React.useEffect(() => {
    if (!graph || graph.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const { nodes: n, edges: e } = buildFlowData(graph, focusedDocumentId);
    setNodes(n);
    setEdges(e);
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 600 }));
  }, [graph, focusedDocumentId, setNodes, setEdges, fitView]);

  React.useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    );
  }, [selectedNodeId, setNodes]);

  useOnSelectionChange({
    onChange: React.useCallback(
      ({ nodes: sel }: { nodes: Node[] }) => {
        onSelectNode(sel[0]?.id ?? null);
      },
      [onSelectNode],
    ),
  });

  const miniMapNodeColor = React.useCallback((node: Node) => {
    const d = node.data as KGNodeData;
    switch (d.nodeType) {
      case GraphNodeType.ROOT:
        return EDGE_COLORS[GraphRelationType.TOPICAL];
      case GraphNodeType.CONCEPT:
        return EDGE_COLORS[GraphRelationType.SEMANTIC_SIMILARITY];
      default:
        return d.isFocused
          ? EDGE_COLORS[GraphRelationType.TOPICAL]
          : EDGE_COLORS[GraphRelationType.SHARED_TAGS];
    }
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange as OnNodesChange}
      onEdgesChange={onEdgesChange as OnEdgesChange}
      nodeTypes={nodeTypes as never}
      edgeTypes={edgeTypes as never}
      colorMode={colorMode}
      connectionMode={ConnectionMode.Loose}
      fitView
      minZoom={0.05}
      maxZoom={3}
      deleteKeyCode={null}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1.2}
        className="opacity-[0.15]"
      />
      <Controls
        position="bottom-right"
        showInteractive={false}
        className="rounded-xl! border! border-border! bg-card! shadow-none! mb-4! mr-4!"
      />
      <MiniMap
        position="bottom-left"
        nodeColor={miniMapNodeColor}
        maskColor={
          colorMode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
        }
        pannable
        zoomable
        style={{ width: 148, height: 96 }}
        className="rounded-xl! border! border-border! bg-card! shadow-none! mb-4! ml-4!"
      />
    </ReactFlow>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-2 py-1 shadow-sm">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-xs font-semibold tabular-nums text-foreground">
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function GraphExplorer() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null,
  );
  const [focusedDocumentId, setFocusedDocumentId] = React.useState<
    string | null
  >(null);
  const [colorMode, setColorMode] = React.useState<ColorMode>('light');

  React.useEffect(() => {
    const root = document.documentElement;
    const update = () =>
      setColorMode(root.classList.contains('dark') ? 'dark' : 'light');
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const { data: fullGraph, error, isLoading } = useFullGraph();
  const {
    data: subgraph,
    error: subgraphError,
    isLoading: subgraphLoading,
  } = useDocumentSubgraph(focusedDocumentId);
  const rebuildMutation = useRebuildDocumentGraph();

  const graph = React.useMemo((): FullGraphData | null => {
    if (subgraph) {
      return {
        nodes: [subgraph.node, ...subgraph.neighborNodes],
        edges: subgraph.directEdges,
        rootNodeId: subgraph.node.id,
      };
    }
    return fullGraph ?? null;
  }, [fullGraph, subgraph]);

  const selectedNode = React.useMemo(
    () => graph?.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graph, selectedNodeId],
  );

  const selectedEdges = React.useMemo(() => {
    if (!selectedNodeId || !graph) return [];
    return graph.edges.filter(
      (e) => e.fromNodeId === selectedNodeId || e.toNodeId === selectedNodeId,
    );
  }, [graph, selectedNodeId]);

  const connectedNodes = React.useMemo(() => {
    if (!selectedNodeId || !graph) return [];
    const ids = new Set<string>();
    for (const e of graph.edges) {
      if (e.fromNodeId === selectedNodeId) ids.add(e.toNodeId);
      if (e.toNodeId === selectedNodeId) ids.add(e.fromNodeId);
    }
    return graph.nodes.filter((n) => ids.has(n.id));
  }, [graph, selectedNodeId]);

  const handleSelectNode = React.useCallback(
    (id: string | null) => setSelectedNodeId(id),
    [],
  );

  const handleClearFocus = React.useCallback(() => {
    setFocusedDocumentId(null);
    if (fullGraph?.rootNodeId) setSelectedNodeId(fullGraph.rootNodeId);
  }, [fullGraph?.rootNodeId]);

  const hasGraph = (graph?.nodes?.length ?? 0) > 0;

  if (error) {
    return (
      <PageContainer>
        <GraphHeader />
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Failed to load graph</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer className="flex h-screen flex-col gap-4 overflow-hidden py-5">
        <GraphHeader />

        {hasGraph && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StatPill
              icon={Network}
              value={graph?.nodes.length ?? 0}
              label="nodes"
            />
            <StatPill
              icon={GitBranch}
              value={graph?.edges.length ?? 0}
              label="edges"
            />

            {(isLoading || subgraphLoading) && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-1.5 shadow-sm">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Updating…</span>
              </div>
            )}

            {focusedDocumentId && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  Subgraph active
                </span>
                <button
                  onClick={handleClearFocus}
                  className="ml-0.5 rounded text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear subgraph focus"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        )}

        <Card className="relative min-h-0 p-0 flex-1 overflow-hidden border-border/50 shadow-sm">
          {isLoading ? (
            <div className="relative h-full w-full p-4">
              <Skeleton className="absolute inset-4 rounded-xl opacity-30" />
              {/* Mock MiniMap */}
              <div className="absolute bottom-8 left-8">
                <Skeleton className="h-24 w-[148px] rounded-xl opacity-50" />
              </div>
              {/* Mock Controls */}
              <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                <Skeleton className="size-8 rounded-lg opacity-50" />
                <Skeleton className="size-8 rounded-lg opacity-50" />
                <Skeleton className="size-8 rounded-lg opacity-50" />
              </div>
            </div>
          ) : hasGraph ? (
            <ReactFlowProvider>
              <InnerFlow
                graph={graph}
                focusedDocumentId={focusedDocumentId}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                colorMode={colorMode}
              />
            </ReactFlowProvider>
          ) : (
            <div className="grid h-full place-items-center bg-muted/5">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BrainCircuit className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No graph yet</EmptyTitle>
                  <EmptyDescription>
                    Ingest documents or rebuild a graph to see relationships.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </Card>

        {hasGraph && (
          <div className="flex shrink-0 items-center justify-between gap-6 pt-3">
            {/* Nodes */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Layers className="size-3.5" />
                Nodes
              </div>

              <div className="flex items-center gap-3">
                {[
                  {
                    label: 'Root',
                    color: EDGE_COLORS[GraphRelationType.TOPICAL],
                  },
                  {
                    label: 'Document',
                    color: EDGE_COLORS[GraphRelationType.SHARED_TAGS],
                  },
                  {
                    label: 'Focused',
                    color: EDGE_COLORS[GraphRelationType.TOPICAL],
                    opacity: 0.5,
                  },
                  {
                    label: 'Concept',
                    color: EDGE_COLORS[GraphRelationType.SEMANTIC_SIMILARITY],
                  },
                ].map(({ label, color, opacity }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: color, opacity: opacity ?? 1 }}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edges */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <GitBranch className="size-3.5" />
                Edges
              </div>

              <div className="flex items-center gap-3">
                {(
                  Object.entries(EDGE_COLORS) as [GraphRelationType, string][]
                ).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span
                      className="h-[2px] w-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {getRelationLabel(type)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      <Sheet
        open={!!selectedNodeId && !!selectedNode}
        onOpenChange={(open) => {
          if (!open) setSelectedNodeId(null);
        }}
        modal={false}
      >
        <SheetContent
          overlay={false}
          className="flex w-full flex-col gap-0 p-0 sm:max-w-[400px]"
        >
          <SheetHeader className="border-b border-border/60 px-6 py-5">
            <SheetTitle className="text-base">Node detail</SheetTitle>
            <SheetDescription className="text-xs">
              Inspect relationships and navigate the graph.
            </SheetDescription>
          </SheetHeader>

          {selectedNode && (
            <ScrollArea className="flex-1 px-6 py-5">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {selectedNode.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedEdges.length} connections
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold leading-snug text-foreground">
                    {selectedNode.label}
                  </h3>
                  {selectedNode.documentId && (
                    <p className="rounded-md bg-muted/60 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                      {selectedNode.documentId}
                    </p>
                  )}
                </div>

                {selectedNode.documentId && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFocusedDocumentId(selectedNode.documentId ?? null)
                        }
                      >
                        <GitBranch className="mr-1.5 size-3.5" />
                        Subgraph
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rebuildMutation.isPending}
                        onClick={() =>
                          void rebuildMutation.mutateAsync(
                            selectedNode.documentId ?? '',
                          )
                        }
                      >
                        {rebuildMutation.isPending ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <RefreshCcw className="mr-1.5 size-3.5" />
                        )}
                        Rebuild
                      </Button>
                    </div>
                    <Button className="w-full" size="sm" asChild>
                      <Link href={`/app/library/${selectedNode.documentId}`}>
                        <ExternalLink className="mr-1.5 size-3.5" />
                        Open document
                      </Link>
                    </Button>
                  </div>
                )}

                {subgraphError && (
                  <Alert variant="destructive">
                    <AlertTitle>Subgraph error</AlertTitle>
                    <AlertDescription>
                      {(subgraphError as Error).message}
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {connectedNodes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Connected nodes ({connectedNodes.length})
                    </p>
                    <div className="space-y-1">
                      {connectedNodes.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setSelectedNodeId(n.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-accent/60"
                        >
                          <p className="truncate pr-2 text-sm font-medium text-foreground">
                            {n.label}
                          </p>
                          <Badge
                            variant="secondary"
                            className="h-4 shrink-0 px-1.5 text-[9px] capitalize"
                          >
                            {n.type}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEdges.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Relationships
                    </p>
                    <div className="space-y-1">
                      {selectedEdges.map((edge) => (
                        <div
                          key={edge.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <div
                              className="size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: getEdgeColor(
                                  edge.relationType,
                                ),
                              }}
                            />
                            <p className="truncate text-sm text-foreground">
                              {getRelationLabel(edge.relationType)}
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                            {edge.weight.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function GraphHeader() {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Knowledge Graph
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore semantic relationships and document connections.
        </p>
      </div>
    </div>
  );
}

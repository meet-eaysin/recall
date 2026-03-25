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
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  BrainCircuit,
  GitBranch,
  Loader2,
  RefreshCcw,
  ExternalLink,
  Network,
  SunMedium,
  Moon,
} from 'lucide-react';
import { GraphNodeType, GraphRelationType } from '@repo/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const RELATION_META: Record<
  GraphRelationType,
  { color: string; label: string }
> = {
  [GraphRelationType.ROOT_CONNECTION]: {
    color: '#94a3b8',
    label: 'Root connection',
  },
  [GraphRelationType.SEMANTIC_SIMILARITY]: {
    color: '#2dd4bf',
    label: 'Semantic similarity',
  },
  [GraphRelationType.SHARED_TAGS]: {
    color: '#60a5fa',
    label: 'Shared tags',
  },
  [GraphRelationType.TOPICAL]: {
    color: '#a78bfa',
    label: 'Topical',
  },
};

function getRelationColor(type: GraphRelationType) {
  return RELATION_META[type]?.color ?? '#94a3b8';
}

function getRelationLabel(type: GraphRelationType) {
  return RELATION_META[type]?.label ?? type;
}

function radialLayout(graph: FullGraphData) {
  const rootId = graph.rootNodeId;
  const others = graph.nodes.filter((n) => n.id !== rootId);
  const positions: { id: string; x: number; y: number }[] = [];

  const rootNode = graph.nodes.find((n) => n.id === rootId);
  if (rootNode) positions.push({ id: rootNode.id, x: 0, y: 0 });

  const count = others.length;
  const rings = Math.ceil(count / 8);
  let placed = 0;

  for (let ring = 0; ring < rings; ring++) {
    const capacity = Math.min(count - placed, 6 + ring * 5);
    const radius = 240 + ring * 200;
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

  const edges: KGEdge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.fromNodeId,
    target: e.toNodeId,
    type: 'kgEdge',
    data: { relationType: e.relationType, weight: e.weight },
    style: {
      stroke: getRelationColor(e.relationType),
      strokeWidth: Math.max(1, e.weight * 2.5),
    },
    animated: e.relationType === GraphRelationType.SEMANTIC_SIMILARITY,
  }));

  return { nodes, edges };
}

function KGHandles() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 w-1 h-1"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 w-1 h-1"
      />
    </>
  );
}

function RootNode({ data, selected }: NodeProps<KGNode>) {
  const d = data as KGNodeData;
  return (
    <div className="relative flex flex-col items-center gap-1.5">
      <NodeToolbar isVisible={selected} position={Position.Top} offset={12}>
        <div className="flex items-center gap-1.5 rounded-lg border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md">
          <BrainCircuit className="size-3 text-violet-500" />
          Knowledge Root · {d.connectionCount} links
        </div>
      </NodeToolbar>

      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-150',
          selected
            ? 'border-violet-400 bg-violet-500 shadow-violet-400/40 scale-110'
            : 'border-violet-300/70 bg-violet-500/90 hover:scale-105 hover:border-violet-400',
        )}
      >
        <BrainCircuit className="size-7 text-white" />
      </div>

      <span className="max-w-[120px] truncate text-center text-[10px] font-semibold text-muted-foreground">
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
        'relative min-w-[130px] max-w-[165px] rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-all duration-150',
        d.isFocused
          ? 'border-sky-400/70 ring-2 ring-sky-400/20'
          : selected
            ? 'border-primary/60 ring-2 ring-primary/15 scale-[1.04]'
            : 'border-border hover:border-border/80 hover:scale-[1.02] hover:shadow-md',
      )}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={8}>
        <div className="flex items-center gap-1.5 rounded-lg border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md">
          {d.connectionCount} connections
          {d.documentId && (
            <span className="rounded bg-sky-100 px-1.5 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
              doc
            </span>
          )}
        </div>
      </NodeToolbar>

      <div className="mb-1 flex items-center gap-1.5">
        <div
          className={cn(
            'size-2 shrink-0 rounded-full',
            d.isFocused ? 'bg-sky-400' : 'bg-blue-400',
          )}
        />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
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
        'relative min-w-[100px] max-w-[140px] rounded-lg border bg-card px-2.5 py-1.5 shadow-sm transition-all duration-150',
        selected
          ? 'border-teal-400/60 ring-2 ring-teal-400/20 scale-[1.04]'
          : 'border-teal-300/50 hover:border-teal-400/60 hover:scale-[1.02]',
      )}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={8}>
        <div className="rounded-lg border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md">
          Concept · {d.connectionCount} connections
        </div>
      </NodeToolbar>

      <div className="mb-0.5 flex items-center gap-1">
        <div className="size-1.5 shrink-0 rounded-full bg-teal-500" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
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
  const color = getRelationColor(d.relationType);

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
    curvature: 0.25,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected
            ? Math.max(2, d.weight * 4)
            : Math.max(1, d.weight * 2),
          strokeOpacity: selected ? 1 : 0.6,
          transition: 'stroke-width 0.15s ease, stroke-opacity 0.15s ease',
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <div
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {getRelationLabel(d.relationType)}
              {' · '}
              {d.weight.toFixed(2)}
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

const edgeTypes = {
  kgEdge: KGEdge,
} as const;

type InnerFlowProps = {
  graph: FullGraphData | null;
  focusedDocumentId: string | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  colorMode: ColorMode;
  children?: React.ReactNode;
};

function InnerFlow({
  graph,
  focusedDocumentId,
  selectedNodeId,
  onSelectNode,
  colorMode,
  children,
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
    requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 500 });
    });
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
        return '#a78bfa';
      case GraphNodeType.CONCEPT:
        return '#2dd4bf';
      default:
        return d.isFocused ? '#38bdf8' : '#60a5fa';
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
      minZoom={0.1}
      maxZoom={3}
      deleteKeyCode={null}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        className="opacity-30"
      />
      <Controls
        position="bottom-right"
        showInteractive={false}
        className="rounded-xl border border-border bg-card shadow-none mb-4 mr-4"
      />
      <MiniMap
        position="bottom-right"
        nodeColor={miniMapNodeColor}
        maskColor={
          colorMode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
        }
        pannable
        zoomable
        className="rounded-xl border border-border bg-card shadow-none"
      />
      {children}
    </ReactFlow>
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

  if (error) {
    return (
      <PageContainer className="space-y-6">
        <GraphHeader />
        <Alert variant="destructive">
          <AlertTitle>Failed to load graph</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <GraphHeader />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setColorMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          title="Toggle graph theme"
          className="shrink-0"
        >
          {colorMode === 'dark' ? (
            <SunMedium className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </div>

      <div className="pt-2 h-[calc(100vh-150px)] min-h-[500px]">
        <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted/10 shadow-sm flex flex-col">
          {isLoading ? (
            <div className="grid h-full place-items-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : graph && graph.nodes.length > 0 ? (
            <ReactFlowProvider>
              <InnerFlow
                graph={graph}
                focusedDocumentId={focusedDocumentId}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                colorMode={colorMode}
              >
                <Panel position="bottom-left" className="m-4">
                  <div className="flex flex-col rounded-xl border border-border/40 bg-background/80 shadow-lg backdrop-blur-md supports-backdrop-filter:bg-background/60 overflow-hidden divide-y divide-border/30">
                    <div className="flex flex-wrap items-center gap-4 px-4 py-2.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Network className="size-3.5" />
                        {graph?.nodes.length ?? 0} nodes
                        <span className="text-border/50 mx-1">•</span>
                        {graph?.edges.length ?? 0} edges
                        
                        {(isLoading || subgraphLoading) && (
                          <>
                            <span className="text-border/50 mx-1">•</span>
                            <div className="flex items-center gap-1.5 text-primary">
                              <Loader2 className="size-3 animate-spin" />
                              Loading...
                            </div>
                          </>
                        )}
                      </div>
                      
                      {focusedDocumentId && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                            Subgraph Active
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={handleClearFocus}
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear focus
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 bg-muted/30">
                      <div className="flex items-center gap-3">
                        {[
                          { label: 'Root', color: '#a78bfa' },
                          { label: 'Document', color: '#60a5fa' },
                          { label: 'Focused', color: '#38bdf8' },
                          { label: 'Concept', color: '#2dd4bf' },
                        ].map(({ label, color }) => (
                          <div key={label} className="flex items-center gap-1.5">
                            <div
                              className="size-2 rounded-full shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="hidden xl:block h-3 w-px bg-border/40" />
                      <div className="flex items-center gap-3">
                        {Object.entries(RELATION_META).map(
                          ([type, { color, label }]) => (
                            <div key={type} className="flex items-center gap-1.5">
                              <div
                                className="w-4 rounded-full brightness-90 shadow-sm"
                                style={{ backgroundColor: color, height: '2px' }}
                              />
                              <span className="text-[11px] font-medium text-muted-foreground tracking-tight">
                                {label}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </Panel>
              </InnerFlow>
            </ReactFlowProvider>
          ) : (
            <Empty className="h-full rounded-none border-0">
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
          )}
        </div>
      </div>

      <Sheet
        open={!!selectedNodeId && !!selectedNode}
        onOpenChange={(open) => {
          if (!open) setSelectedNodeId(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto outline-none">
          <SheetHeader className="mb-6 space-y-1">
            <SheetTitle>Node Selection</SheetTitle>
            <SheetDescription>
              Inspect the selected node and its relationships.
            </SheetDescription>
          </SheetHeader>

          {selectedNode && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedNode.type}
                  </Badge>
                  <Badge variant="outline">
                    {selectedEdges.length} connections
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold leading-snug text-foreground">
                  {selectedNode.label}
                </h3>
                {selectedNode.documentId && (
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {selectedNode.documentId}
                  </p>
                )}
              </div>

              {selectedNode.documentId && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setFocusedDocumentId(selectedNode.documentId ?? null)
                    }
                  >
                    <GitBranch className="size-3.5 mr-2" />
                    Focus subgraph
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={rebuildMutation.isPending}
                    onClick={() =>
                      void rebuildMutation.mutateAsync(
                        selectedNode.documentId ?? '',
                      )
                    }
                  >
                    {rebuildMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin mr-2" />
                    ) : (
                      <RefreshCcw className="size-3.5 mr-2" />
                    )}
                    Rebuild graph
                  </Button>
                </div>
              )}

              {selectedNode.documentId && (
                <Button className="w-full" asChild>
                  <Link href={`/app/library/${selectedNode.documentId}`}>
                    <ExternalLink className="size-4 mr-2" />
                    Open Document Detail
                  </Link>
                </Button>
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
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Connected nodes
                  </p>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2">
                    {connectedNodes.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedNodeId(n.id)}
                        className="w-full flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                      >
                        <p className="text-sm font-medium text-foreground truncate pr-2">
                          {n.label}
                        </p>
                        <Badge
                          variant="secondary"
                          className="capitalize shrink-0 text-[10px] px-1.5 py-0 h-4"
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
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Relationships
                  </p>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2">
                    {selectedEdges.map((edge) => (
                      <div
                        key={edge.id}
                        className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="size-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: getRelationColor(
                                edge.relationType,
                              ),
                            }}
                          />
                          <p className="truncate text-sm text-foreground">
                            {getRelationLabel(edge.relationType)}
                          </p>
                        </div>
                        <span className="ml-2 shrink-0 text-xs font-mono text-muted-foreground">
                          {edge.weight.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

function GraphHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
      <p className="text-sm text-muted-foreground">
        Explore semantic relationships and document connections across your
        workspace.
      </p>
    </header>
  );
}

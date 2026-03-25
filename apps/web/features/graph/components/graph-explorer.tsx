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
  Search,
  SunMedium,
  Moon,
  ExternalLink,
  X,
  Layers,
  Network,
  Info,
} from 'lucide-react';
import { GraphNodeType, GraphRelationType } from '@repo/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useDocumentSubgraph,
  useFullGraph,
  useRebuildDocumentGraph,
} from '../hooks';
import type { FullGraphData, GraphNodeRow } from '../types';
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

function AllSidesHandles({ size = 6 }: { size?: number }) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    background: 'transparent',
    border: 'none',
  };
  return (
    <>
      <Handle type="source" position={Position.Top} style={style} />
      <Handle type="source" position={Position.Right} style={style} />
      <Handle type="source" position={Position.Bottom} style={style} />
      <Handle type="source" position={Position.Left} style={style} />
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

      <AllSidesHandles size={4} />
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

      <AllSidesHandles size={5} />
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

      <AllSidesHandles size={4} />
    </div>
  );
}

function KGEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<KGEdge>) {
  const d = data as KGEdgeData;
  const color = getRelationColor(d.relationType);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.35,
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
        showInteractive={false}
        className="rounded-xl border border-border bg-card shadow-none"
      />
      <MiniMap
        nodeColor={miniMapNodeColor}
        maskColor={
          colorMode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
        }
        pannable
        zoomable
        className="rounded-xl border border-border bg-card shadow-none"
      />
    </ReactFlow>
  );
}

export function GraphExplorer() {
  const [search, setSearch] = React.useState('');
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

  const filteredDocumentNodes = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return (fullGraph?.nodes ?? [])
      .filter((n) => n.type === GraphNodeType.DOCUMENT)
      .filter((n) => (q ? n.label.toLowerCase().includes(q) : true))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [fullGraph?.nodes, search]);

  const handleSelectNode = React.useCallback(
    (id: string | null) => setSelectedNodeId(id),
    [],
  );

  const handleFocusDocument = React.useCallback((node: GraphNodeRow) => {
    setSelectedNodeId(node.id);
    if (node.documentId) setFocusedDocumentId(node.documentId);
  }, []);

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

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <Card className="overflow-hidden">
          <CardHeader className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Document network</CardTitle>
                <CardDescription>
                  Drag to pan · Scroll to zoom · Click a node to inspect
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Network className="size-3" />
                  {graph?.nodes.length ?? 0} nodes
                </Badge>
                <Badge variant="secondary">
                  {graph?.edges.length ?? 0} edges
                </Badge>
                {focusedDocumentId && <Badge variant="outline">Subgraph</Badge>}
                {(isLoading || subgraphLoading) && (
                  <Badge variant="outline" className="gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Loading
                  </Badge>
                )}
                {focusedDocumentId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFocus}
                  >
                    <GitBranch className="size-3.5" />
                    Full graph
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 px-5 pb-5 pt-0">
            <div className="relative overflow-hidden rounded-xl border bg-muted/20 h-[62vh] min-h-[420px] xl:h-[66vh]">
              {isLoading ? (
                <div className="grid h-full place-items-center">
                  <Loader2 className="size-7 animate-spin text-muted-foreground" />
                </div>
              ) : graph && graph.nodes.length > 0 ? (
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

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {[
                { label: 'Root', color: '#a78bfa' },
                { label: 'Document', color: '#60a5fa' },
                { label: 'Focused', color: '#38bdf8' },
                { label: 'Concept', color: '#2dd4bf' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
              <div className="hidden xl:block h-3 w-px bg-border" aria-hidden />
              {Object.entries(RELATION_META).map(([type, { color, label }]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div
                    className="h-px w-5 rounded"
                    style={{ backgroundColor: color, height: 2 }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4 text-muted-foreground" />
                Focus documents
              </CardTitle>
              <CardDescription>
                Click a document to view its local neighborhood.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <Search className="size-4 text-muted-foreground" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents…"
                />
              </InputGroup>

              <ScrollArea className="h-60 rounded-lg border bg-muted/10">
                <div className="space-y-0.5 p-1.5">
                  {filteredDocumentNodes.length > 0 ? (
                    filteredDocumentNodes.map((node) => {
                      const isFocused = node.documentId === focusedDocumentId;
                      const isSelected = node.id === selectedNodeId;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => handleFocusDocument(node)}
                          className={cn(
                            'w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent',
                            (isFocused || isSelected) &&
                              'bg-accent ring-1 ring-primary/25',
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="line-clamp-1 text-sm font-medium text-foreground">
                              {node.label}
                            </p>
                            {isFocused && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 text-[10px]"
                              >
                                focused
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isFocused ? 'Subgraph active' : 'Open local graph'}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No documents match your search.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Selection</CardTitle>
                {selectedNodeId && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSelectedNodeId(null)}
                    title="Clear selection"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
              {!selectedNodeId && (
                <CardDescription>
                  Click a node in the graph to inspect it.
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-0">
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="capitalize">
                        {selectedNode.type}
                      </Badge>
                      <Badge variant="outline">
                        {selectedEdges.length} connections
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold leading-snug text-foreground">
                      {selectedNode.label}
                    </p>
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
                        onClick={() =>
                          setFocusedDocumentId(selectedNode.documentId ?? null)
                        }
                      >
                        <GitBranch className="size-3.5" />
                        Focus subgraph
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
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <RefreshCcw className="size-3.5" />
                        )}
                        Rebuild
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {connectedNodes.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Connected nodes
                      </p>
                      <div className="space-y-1">
                        {connectedNodes.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setSelectedNodeId(n.id)}
                            className="w-full rounded-lg border px-3 py-1.5 text-left transition-colors hover:bg-accent"
                          >
                            <p className="text-sm font-medium text-foreground">
                              {n.label}
                            </p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {n.type}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEdges.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Relationships
                        </p>
                        <div className="space-y-1">
                          {selectedEdges.map((edge) => (
                            <div
                              key={edge.id}
                              className="flex items-center justify-between rounded-lg border px-3 py-1.5"
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
                              <span className="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">
                                {edge.weight.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedNode.documentId && (
                    <Button className="w-full" asChild>
                      <Link href={`/app/library/${selectedNode.documentId}`}>
                        <ExternalLink className="size-4" />
                        Open document
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
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Info className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Select a node to inspect its details and relationships.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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

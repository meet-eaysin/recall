'use client';

import * as React from 'react';
import Link from 'next/link';
import Graph from 'graphology';
import Sigma from 'sigma';
import type { NodeDisplayData, PartialButFor } from 'sigma/types';
import {
  BrainCircuit,
  GitBranch,
  Loader2,
  Minus,
  Plus,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { GraphNodeType, GraphRelationType } from '@repo/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Toolbar, ToolbarGroup } from '@/components/ui/toolbar';
import { cn } from '@/lib/utils';
import {
  useDocumentSubgraph,
  useFullGraph,
  useRebuildDocumentGraph,
} from '../hooks';
import type { FullGraphData, GraphEdgeRow, GraphNodeRow } from '../types';
import { PageContainer } from '@/features/workspace/components/page-container';

type SigmaNodeAttributes = {
  color: string;
  documentId?: string;
  isRoot: boolean;
  label: string;
  originalLabel: string;
  size: number;
  x: number;
  y: number;
};

type SigmaEdgeAttributes = {
  color: string;
  relationType: GraphRelationType;
  size: number;
  weight: number;
};

type PositionedNode = GraphNodeRow & {
  x: number;
  y: number;
};

function drawGraphNodeLabel(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, 'x' | 'y' | 'size' | 'label' | 'color'>,
) {
  if (!data.label) return;

  context.save();
  context.font =
    '500 11px var(--font-sans, ui-sans-serif, system-ui, sans-serif)';
  context.fillStyle = data.highlighted ? '#0f172a' : '#334155';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(data.label, data.x, data.y + data.size + 6);
  context.restore();
}

function suppressGraphNodeHover() {
  return;
}

function getRelationLabel(type: GraphRelationType) {
  switch (type) {
    case GraphRelationType.ROOT_CONNECTION:
      return 'Root connection';
    case GraphRelationType.SEMANTIC_SIMILARITY:
      return 'Semantic similarity';
    case GraphRelationType.SHARED_TAGS:
      return 'Shared tags';
    case GraphRelationType.TOPICAL:
      return 'Topical';
    default:
      return type;
  }
}

function getRelationColor(type: GraphRelationType) {
  switch (type) {
    case GraphRelationType.ROOT_CONNECTION:
      return '#64748b';
    case GraphRelationType.SEMANTIC_SIMILARITY:
      return '#0f766e';
    case GraphRelationType.SHARED_TAGS:
      return '#2563eb';
    case GraphRelationType.TOPICAL:
      return '#7c3aed';
    default:
      return '#94a3b8';
  }
}

function getNodeColor(type: GraphNodeType, isFocused: boolean) {
  switch (type) {
    case GraphNodeType.ROOT:
      return '#0f172a';
    case GraphNodeType.CONCEPT:
      return '#8b5cf6';
    case GraphNodeType.DOCUMENT:
      return isFocused ? '#2563eb' : '#94a3b8';
    default:
      return '#94a3b8';
  }
}

function truncateLabel(label: string, limit: number) {
  return label.length > limit ? `${label.slice(0, limit)}…` : label;
}

function toDisplayGraph(
  fullGraph: FullGraphData | undefined,
  subgraph:
    | {
        directEdges: GraphEdgeRow[];
        neighborNodes: GraphNodeRow[];
        node: GraphNodeRow;
      }
    | undefined,
): FullGraphData | null {
  if (subgraph) {
    return {
      nodes: [subgraph.node, ...subgraph.neighborNodes],
      edges: subgraph.directEdges,
      rootNodeId: subgraph.node.id,
    };
  }

  return fullGraph ?? null;
}

function positionGraphNodes(graph: FullGraphData | null): PositionedNode[] {
  if (!graph) return [];

  const rootId = graph.rootNodeId;
  const rootNode = graph.nodes.find((node) => node.id === rootId) ?? null;
  const otherNodes = graph.nodes
    .filter((node) => node.id !== rootId)
    .sort((a, b) => a.label.localeCompare(b.label));

  const positioned: PositionedNode[] = [];

  if (rootNode) {
    positioned.push({ ...rootNode, x: 0, y: 0 });
  }

  if (otherNodes.length > 0 && otherNodes.length <= 4) {
    const presets = {
      1: [-90],
      2: [-135, -45],
      3: [-150, -90, -30],
      4: [-160, -115, -65, -20],
    } as const;
    const angles = presets[otherNodes.length as keyof typeof presets];
    const radius = 5.4;

    for (let index = 0; index < otherNodes.length; index += 1) {
      const node = otherNodes[index];
      if (!node) continue;
      const angle = ((angles[index] ?? -90) * Math.PI) / 180;
      positioned.push({
        documentId: node.documentId,
        id: node.id,
        label: node.label,
        type: node.type,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }

    return positioned;
  }

  let cursor = 0;
  let ring = 0;
  while (cursor < otherNodes.length) {
    const capacity = Math.min(otherNodes.length - cursor, 8 + ring * 6);
    const radius = 5.5 + ring * 3.75;

    for (let index = 0; index < capacity; index += 1) {
      const node = otherNodes[cursor + index];
      if (!node) continue;
      const angle = -Math.PI / 2 + (index / capacity) * Math.PI * 2;
      positioned.push({
        documentId: node.documentId,
        id: node.id,
        label: node.label,
        type: node.type,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }

    cursor += capacity;
    ring += 1;
  }

  if (!rootNode && positioned.length === 0 && graph.nodes.length === 1) {
    const single = graph.nodes[0];
    if (single) {
      positioned.push({
        documentId: single.documentId,
        id: single.id,
        label: single.label,
        type: single.type,
        x: 0,
        y: 0,
      });
    }
  }

  return positioned;
}

function buildConnections(edges: GraphEdgeRow[]) {
  const map = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!map.has(edge.fromNodeId)) {
      map.set(edge.fromNodeId, new Set<string>());
    }
    if (!map.has(edge.toNodeId)) {
      map.set(edge.toNodeId, new Set<string>());
    }

    map.get(edge.fromNodeId)?.add(edge.toNodeId);
    map.get(edge.toNodeId)?.add(edge.fromNodeId);
  }

  return map;
}

export function GraphExplorer() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rendererRef = React.useRef<Sigma | null>(null);
  const graphRef = React.useRef<Graph | null>(null);
  const selectedNodeIdRef = React.useRef<string | null>(null);
  const hoveredNodeIdRef = React.useRef<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null,
  );
  const [focusedDocumentId, setFocusedDocumentId] = React.useState<
    string | null
  >(null);
  const [labelThreshold, setLabelThreshold] = React.useState(14);

  const { data: fullGraph, error, isLoading } = useFullGraph();
  const {
    data: subgraph,
    error: subgraphError,
    isLoading: subgraphLoading,
  } = useDocumentSubgraph(focusedDocumentId);
  const rebuildMutation = useRebuildDocumentGraph();

  const graph = React.useMemo(
    () => toDisplayGraph(fullGraph, subgraph),
    [fullGraph, subgraph],
  );

  React.useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  const positionedNodes = React.useMemo(
    () => positionGraphNodes(graph),
    [graph],
  );

  const connectedByNode = React.useMemo(
    () => buildConnections(graph?.edges ?? []),
    [graph?.edges],
  );

  const selectedNode =
    graph?.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const selectedEdges = React.useMemo(() => {
    if (!selectedNodeId || !graph) return [];
    return graph.edges.filter(
      (edge) =>
        edge.fromNodeId === selectedNodeId || edge.toNodeId === selectedNodeId,
    );
  }, [graph, selectedNodeId]);

  const connectedNodeIds = React.useMemo(() => {
    return new Set(connectedByNode.get(selectedNodeId ?? '') ?? []);
  }, [connectedByNode, selectedNodeId]);

  const filteredDocumentNodes = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return (fullGraph?.nodes ?? [])
      .filter((node) => node.type === GraphNodeType.DOCUMENT)
      .filter((node) =>
        query.length > 0 ? node.label.toLowerCase().includes(query) : true,
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [fullGraph?.nodes, search]);

  const applyDefaultCameraState = React.useCallback((animated = true) => {
    const camera = rendererRef.current?.getCamera();
    if (!camera) return;

    if (animated) {
      void camera.animate(
        { angle: 0, ratio: 2.7, x: 0.5, y: 0.5 },
        { duration: 260 },
      );
      return;
    }

    camera.setState({ angle: 0, ratio: 2.7, x: 0.5, y: 0.5 });
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (rendererRef.current) {
      rendererRef.current.kill();
      rendererRef.current = null;
    }

    if (positionedNodes.length === 0 || !graph) {
      return;
    }

    const sigmaGraph = new Graph() as Graph & {
      addEdgeWithKey: (
        key: string,
        source: string,
        target: string,
        attributes: SigmaEdgeAttributes,
      ) => void;
      addNode: (key: string, attributes: SigmaNodeAttributes) => void;
      source: (edge: string) => string;
      target: (edge: string) => string;
    };

    for (const node of positionedNodes) {
      const isRoot = node.type === GraphNodeType.ROOT;
      const isFocused = node.documentId === focusedDocumentId;
      sigmaGraph.addNode(node.id, {
        color: getNodeColor(node.type as GraphNodeType, isFocused),
        documentId: node.documentId,
        isRoot,
        label: isRoot ? 'User Brain' : truncateLabel(node.label, 24),
        originalLabel: node.label,
        size: isRoot
          ? 14
          : isFocused
            ? 8.5
            : node.type === GraphNodeType.CONCEPT
              ? 8
              : 7.5,
        x: node.x,
        y: node.y,
      });
    }

    for (const edge of graph.edges) {
      sigmaGraph.addEdgeWithKey(edge.id, edge.fromNodeId, edge.toNodeId, {
        color: getRelationColor(edge.relationType),
        relationType: edge.relationType,
        size: Math.max(1.5, edge.weight * 4),
        weight: edge.weight,
      });
    }

    graphRef.current = sigmaGraph;

    const renderer = new Sigma(sigmaGraph, container, {
      allowInvalidContainer: true,
      enableEdgeEvents: true,
      labelDensity: 0.56,
      labelGridCellSize: 140,
      labelRenderedSizeThreshold: labelThreshold,
      defaultDrawNodeHover: suppressGraphNodeHover,
      labelSize: 8,
      labelWeight: '400',
      defaultDrawNodeLabel: drawGraphNodeLabel,
      minCameraRatio: 0.35,
      maxCameraRatio: 3.4,
      nodeHoverProgramClasses: {},
      renderEdgeLabels: false,
      zIndex: true,
    });

    renderer.setSetting('nodeReducer', (node, data) => {
      const currentSelected = selectedNodeIdRef.current;
      const currentHovered = hoveredNodeIdRef.current;
      const relatedNodes = currentSelected
        ? (connectedByNode.get(currentSelected) ?? new Set<string>())
        : new Set<string>();
      const isSelected = node === currentSelected;
      const isHovered = node === currentHovered;
      const isRelated = relatedNodes.has(node);
      const isDimmed =
        currentSelected != null &&
        !isSelected &&
        !isRelated &&
        currentSelected !== node;
      const isDocument = !data.isRoot;

      return {
        ...data,
        color: isSelected
          ? '#0f172a'
          : isHovered
            ? '#2563eb'
            : isRelated
              ? '#60a5fa'
              : data.color,
        forceLabel: isDocument || isSelected || isHovered,
        highlighted: isSelected || isHovered,
        label: isDimmed
          ? ''
          : data.isRoot
            ? isSelected || isHovered
              ? data.label
              : ''
            : data.label,
        size: isSelected
          ? data.size + 1.5
          : isHovered
            ? data.size + 1
            : data.size,
        zIndex: isSelected || isHovered ? 1 : 0,
      };
    });

    renderer.setSetting('edgeReducer', (edge, data) => {
      const currentSelected = selectedNodeIdRef.current;
      const isActive =
        currentSelected != null &&
        [sigmaGraph.source(edge), sigmaGraph.target(edge)].some(
          (nodeId: string) => nodeId === currentSelected,
        );

      return {
        ...data,
        color: isActive ? data.color : '#cbd5e1',
        hidden: false,
        size: isActive ? data.size + 0.5 : Math.max(1, data.size - 0.4),
        zIndex: isActive ? 1 : 0,
      };
    });

    renderer.on('clickNode', ({ node }) => {
      setSelectedNodeId(node);
    });

    renderer.on('enterNode', ({ node }) => {
      hoveredNodeIdRef.current = node;
      container.style.cursor = 'pointer';
      renderer.refresh();
    });

    renderer.on('leaveNode', () => {
      hoveredNodeIdRef.current = null;
      container.style.cursor = 'grab';
      renderer.refresh();
    });

    renderer.on('clickStage', () => {
      setSelectedNodeId(null);
    });

    container.style.cursor = 'grab';
    applyDefaultCameraState(false);
    renderer.refresh();
    rendererRef.current = renderer;

    return () => {
      renderer.kill();
      rendererRef.current = null;
      graphRef.current = null;
    };
  }, [
    applyDefaultCameraState,
    connectedByNode,
    focusedDocumentId,
    graph,
    labelThreshold,
    positionedNodes,
  ]);

  React.useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setSetting('labelRenderedSizeThreshold', labelThreshold);
    renderer.refresh();
  }, [labelThreshold]);

  React.useEffect(() => {
    rendererRef.current?.refresh();
  }, [selectedNodeId, focusedDocumentId]);

  const zoomIn = React.useCallback(() => {
    rendererRef.current?.getCamera().animatedZoom({ duration: 250 });
  }, []);

  const zoomOut = React.useCallback(() => {
    rendererRef.current?.getCamera().animatedUnzoom({ duration: 250 });
  }, []);

  const resetZoom = React.useCallback(() => {
    applyDefaultCameraState(true);
  }, [applyDefaultCameraState]);

  if (error) {
    return (
      <PageContainer className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-muted-foreground">
            Visualize your document network and semantic relationships.
          </p>
        </header>
        <div className="mt-4">
          <Alert variant="error">
            <AlertTitle>Failed to load graph</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground">
          Explore your document network with a stable graph view, direct
          selection, and scoped subgraphs.
        </p>
      </header>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden">
          <CardHeader className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Document network</CardTitle>
                <CardDescription>
                  Stable layout, zoom controls, and readable labels.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {focusedDocumentId ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFocusedDocumentId(null);
                      if (fullGraph?.rootNodeId) {
                        setSelectedNodeId(fullGraph.rootNodeId);
                      }
                    }}
                  >
                    <GitBranch className="size-4" />
                    Full graph
                  </Button>
                ) : null}
                <Button variant="outline" onClick={resetZoom}>
                  <RefreshCcw className="size-4" />
                  Reset view
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardPanel className="space-y-3 px-5 pb-5 pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {graph?.nodes.length ?? 0} nodes
              </Badge>
              <Badge variant="secondary">
                {graph?.edges.length ?? 0} edges
              </Badge>
              <Badge variant="outline">
                {focusedDocumentId ? 'Focused subgraph' : 'Full graph'}
              </Badge>
              {subgraphLoading ? (
                <Badge variant="outline">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading focus
                </Badge>
              ) : null}
            </div>

            <div className="relative overflow-hidden rounded-sm border bg-background">
              <div className="absolute right-3 top-3 z-10">
                <Toolbar className="items-center gap-2 rounded-sm border">
                  <ToolbarGroup>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="rounded-md text-muted-foreground"
                      onClick={zoomOut}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="rounded-md text-muted-foreground"
                      onClick={zoomIn}
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="rounded-md text-muted-foreground"
                      onClick={resetZoom}
                    >
                      <RefreshCcw className="size-4" />
                    </Button>
                  </ToolbarGroup>
                </Toolbar>
                <Toolbar className="mt-2 w-32 border bg-background p-1.5 md:hidden">
                  <ToolbarGroup className="w-full gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Labels
                    </span>
                    <Slider
                      aria-label="Labels threshold"
                      className="min-w-0 flex-1"
                      max={20}
                      min={6}
                      step={0.5}
                      value={labelThreshold}
                      onValueChange={(value) =>
                        setLabelThreshold(
                          Array.isArray(value) ? (value[0] ?? 12) : value,
                        )
                      }
                    />
                  </ToolbarGroup>
                </Toolbar>
              </div>

              {isLoading ? (
                <div className="grid h-[64vh] min-h-[420px] place-items-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : graph && graph.nodes.length > 0 ? (
                <div
                  ref={containerRef}
                  className="h-[64vh] min-h-[420px] w-full touch-none md:h-[70vh]"
                />
              ) : (
                <Empty className="h-[64vh] min-h-[420px] rounded-none border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BrainCircuit className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>No graph yet</EmptyTitle>
                    <EmptyDescription>
                      Ingest more documents or rebuild a document graph to see
                      relationships here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </CardPanel>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 py-4">
              <CardTitle>Focus documents</CardTitle>
              <CardDescription>
                Search documents, then open a local neighborhood.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-3 px-4 pb-4 pt-0">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <Search className="size-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search document nodes"
                />
              </InputGroup>

              <ScrollArea className="h-72 rounded-lg border bg-muted/15">
                <div className="space-y-1 p-2">
                  {filteredDocumentNodes.length > 0 ? (
                    filteredDocumentNodes.map((node) => {
                      const isFocused = node.documentId === focusedDocumentId;
                      const isSelected = node.id === selectedNodeId;

                      return (
                        <button
                          key={node.id}
                          type="button"
                          className={cn(
                            'w-full rounded-md px-3 py-2 text-left transition hover:bg-accent',
                            (isFocused || isSelected) && 'bg-accent',
                          )}
                          onClick={() => {
                            setSelectedNodeId(String(node.id));
                            if (node.documentId) {
                              setFocusedDocumentId(node.documentId);
                            }
                          }}
                        >
                          <p className="line-clamp-1 text-sm font-medium text-foreground">
                            {node.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isFocused
                              ? 'Focused subgraph'
                              : 'Open local graph'}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      No document nodes match your search.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardPanel>
          </Card>

          <Card>
            <CardHeader className="px-4 py-4">
              <CardTitle>Selection</CardTitle>
              <CardDescription>
                Inspect the selected node and related documents.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-4 px-4 pb-4 pt-0">
              {selectedNode ? (
                <>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {selectedNode.type}
                      </Badge>
                      <Badge variant="outline">
                        {selectedEdges.length} connections
                      </Badge>
                    </div>
                    <p className="text-base font-medium text-foreground">
                      {selectedNode.label}
                    </p>
                    {selectedNode.documentId ? (
                      <p className="text-xs text-muted-foreground">
                        Document ID: {selectedNode.documentId}
                      </p>
                    ) : null}
                  </div>

                  {selectedNode.documentId ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setFocusedDocumentId(selectedNode.documentId ?? null)
                        }
                      >
                        <GitBranch className="size-4" />
                        Focus subgraph
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          void rebuildMutation.mutateAsync(
                            selectedNode.documentId ?? '',
                          )
                        }
                        disabled={rebuildMutation.isPending}
                      >
                        {rebuildMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="size-4" />
                        )}
                        Rebuild graph
                      </Button>
                    </div>
                  ) : null}

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Connected nodes
                    </p>
                    {graph?.nodes.filter((node) =>
                      connectedNodeIds.has(node.id),
                    ).length ? (
                      <div className="space-y-2">
                        {graph?.nodes
                          .filter((node) => connectedNodeIds.has(node.id))
                          .map((node) => (
                            <button
                              key={node.id}
                              type="button"
                              className="w-full rounded-md border px-3 py-2 text-left transition hover:bg-accent"
                              onClick={() => setSelectedNodeId(node.id)}
                            >
                              <p className="text-sm font-medium text-foreground">
                                {node.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {node.type}
                              </p>
                            </button>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No connected nodes for this selection.
                      </p>
                    )}
                  </div>

                  {selectedEdges.length > 0 ? (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          Relationships
                        </p>
                        {selectedEdges.map((edge) => (
                          <div
                            key={edge.id}
                            className="rounded-md border px-3 py-2 text-sm"
                          >
                            <p className="font-medium text-foreground">
                              {getRelationLabel(edge.relationType)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Weight {edge.weight.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}

              {selectedNode?.documentId ? (
                <Button
                  className="w-full"
                  render={
                    <Link href={`/app/library/${selectedNode.documentId}`} />
                  }
                >
                  Open document
                </Button>
              ) : null}

              {subgraphError ? (
                <Alert variant="error">
                  <AlertTitle>Subgraph failed</AlertTitle>
                  <AlertDescription>
                    {(subgraphError as Error).message}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardPanel>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Input } from "@/components/ui/input";
import type { TopicDto } from "@/types/roadmap";

type KnowledgeGraphProps = {
  topics: TopicDto[];
  projectSlug: string;
};

const STATUS_COLORS: Record<TopicDto["status"], string> = {
  LOCKED: "#94a3b8",
  AVAILABLE: "#6366f1",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#10b981",
};

function layoutNodes(topics: TopicDto[]): Node[] {
  const columns = 4;
  return topics.map((topic, index) => ({
    id: topic.id,
    data: {
      label: topic.title,
      status: topic.status,
      slug: topic.slug,
    },
    position: {
      x: (index % columns) * 220,
      y: Math.floor(index / columns) * 120,
    },
    style: {
      borderColor: STATUS_COLORS[topic.status],
      borderWidth: 2,
      borderRadius: 12,
      padding: 8,
      fontSize: 12,
      width: 180,
      background: "var(--card)",
      color: "var(--foreground)",
      opacity: topic.status === "LOCKED" ? 0.65 : 1,
    },
  }));
}

function buildEdges(topics: TopicDto[]): Edge[] {
  const topicBySlug = new Map(topics.map((t) => [t.slug, t]));
  const edges: Edge[] = [];

  for (const topic of topics) {
    for (const parentSlug of topic.prerequisiteSlugs) {
      const parent = topicBySlug.get(parentSlug);
      if (!parent) continue;
      edges.push({
        id: `${parent.id}-${topic.id}`,
        source: parent.id,
        target: topic.id,
        animated: topic.status === "IN_PROGRESS",
      });
    }
  }

  return edges;
}

export function KnowledgeGraph({ topics, projectSlug }: KnowledgeGraphProps) {
  const [search, setSearch] = React.useState("");
  const initialNodes = React.useMemo(() => layoutNodes(topics), [topics]);
  const initialEdges = React.useMemo(() => buildEdges(topics), [topics]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(layoutNodes(topics));
    setEdges(buildEdges(topics));
  }, [topics, setNodes, setEdges]);

  React.useEffect(() => {
    const query = search.trim().toLowerCase();
    setNodes((current) =>
      current.map((node) => {
        const label = String(node.data.label ?? "").toLowerCase();
        const match = !query || label.includes(query);
        return {
          ...node,
          style: {
            ...node.style,
            opacity: match ? (node.data.status === "LOCKED" ? 0.65 : 1) : 0.25,
          },
        };
      }),
    );
  }, [search, setNodes]);

  return (
    <div className="space-y-3 rounded-xl border bg-background/50 p-4">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search topics..."
        aria-label="Search knowledge graph"
      />
      <div className="h-[520px] overflow-hidden rounded-xl border bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          onNodeClick={(_, node) => {
            const slug = node.data.slug as string;
            const status = node.data.status as TopicDto["status"];
            if (status !== "LOCKED") {
              window.location.href = `/projects/${projectSlug}/topics/${slug}`;
            }
          }}
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
    </div>
  );
}

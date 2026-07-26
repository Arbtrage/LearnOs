"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { PendingButton } from "@/components/common/PendingButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RESOURCE_TYPES, type ResourceDto } from "@/types/resources";
import type { TopicDto } from "@/types/roadmap";

type AddResourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onCreated: (resource: ResourceDto) => void;
};

export function AddResourceDialog({
  open,
  onOpenChange,
  projectId,
  onCreated,
}: AddResourceDialogProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("ARTICLE");
  const [topicId, setTopicId] = useState<string>("none");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [error, setError] = useState<string | null>(null);

  const topicsQuery = useQuery({
    queryKey: ["topics", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/topics`);
      if (!res.ok) throw new Error("Failed to load topics");
      const data = (await res.json()) as { topics: TopicDto[] };
      return data.topics;
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || undefined,
          type,
          topicId: topicId === "none" ? undefined : topicId,
          estimatedMinutes: Number.parseInt(estimatedMinutes, 10) || 30,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to add resource");
      }
      return (await res.json()) as ResourceDto;
    },
    onSuccess: (resource) => {
      resetForm();
      onCreated(resource);
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to add resource");
    },
  });

  function resetForm() {
    setTitle("");
    setUrl("");
    setDescription("");
    setType("ARTICLE");
    setTopicId("none");
    setEstimatedMinutes("30");
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
      title="Add your own resource"
      description="Paste a link you trust. We'll verify the URL and add it to your library."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="resource-url">URL</Label>
          <Input
            id="resource-url"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resource-title">Title</Label>
          <Input
            id="resource-title"
            placeholder="What is this resource about?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resource-description">Description (optional)</Label>
          <textarea
            id="resource-description"
            placeholder="Why is this useful for your learning?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            className={cn(
              "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none",
              "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
              "dark:bg-input/30",
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(next) => next && setType(next)}>
              <SelectTrigger aria-label="Resource type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.filter((t) => t !== "INTERNAL").map((resourceType) => (
                  <SelectItem key={resourceType} value={resourceType}>
                    {resourceType.charAt(0) + resourceType.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-minutes">Est. minutes</Label>
            <Input
              id="resource-minutes"
              type="number"
              min={5}
              max={480}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Link to topic (optional)</Label>
          <Select value={topicId} onValueChange={(next) => next && setTopicId(next)}>
            <SelectTrigger aria-label="Topic">
              <SelectValue placeholder="No specific topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific topic</SelectItem>
              {(topicsQuery.data ?? []).map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <PendingButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </PendingButton>
          <PendingButton type="submit" pending={createMutation.isPending} pendingLabel="Verifying link…">
            Add resource
          </PendingButton>
        </div>
      </form>
    </Modal>
  );
}

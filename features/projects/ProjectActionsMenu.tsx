"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/common/Modal";
import { clearLastProjectCookie } from "@/lib/cookies/last-project.actions";

type ProjectActionsMenuProps = {
  projectId: string;
  slug: string;
  title: string;
  status: string;
  /** When deleting/archiving from inside the project workspace */
  currentSlug?: string;
  variant?: "icon" | "button";
  onComplete?: () => void;
};

export function ProjectActionsMenu({
  projectId,
  slug,
  title,
  status,
  currentSlug,
  variant = "icon",
  onComplete,
}: ProjectActionsMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    onComplete?.();
  };

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) throw new Error("Failed to archive project");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      if (currentSlug === slug) {
        void clearLastProjectCookie();
        router.push("/dashboard");
      }
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) throw new Error("Failed to restore project");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      router.refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      setDeleteOpen(false);
      invalidate();
      if (currentSlug === slug) {
        router.push("/dashboard");
      } else {
        router.refresh();
      }
    },
  });

  const isArchived = status === "ARCHIVED";
  const isPending =
    archiveMutation.isPending ||
    unarchiveMutation.isPending ||
    deleteMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "icon" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0"
              aria-label={`Actions for ${title}`}
              disabled={isPending}
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={isPending}>
              Manage project
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/projects/${slug}/settings`} className="cursor-pointer gap-2">
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isArchived ? (
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              disabled={isPending}
              onClick={() => unarchiveMutation.mutate()}
            >
              <ArchiveRestore className="size-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              disabled={isPending}
              onClick={() => archiveMutation.mutate()}
            >
              <Archive className="size-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
            disabled={isPending}
            onClick={() => {
              setConfirmTitle("");
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete project permanently?"
        description={`This removes "${title}" and all its topics, resources, sessions, and progress. This cannot be undone.`}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Type <span className="font-medium text-foreground">{title}</span> to confirm.
          </p>
          <input
            type="text"
            value={confirmTitle}
            onChange={(e) => setConfirmTitle(e.target.value)}
            placeholder={title}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmTitle !== title || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete project"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

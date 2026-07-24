import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

type WorkspaceEmptyStateProps = {
  title: string;
  description: string;
};

export function WorkspaceEmptyState({
  title,
  description,
}: WorkspaceEmptyStateProps) {
  return (
    <EmptyState
      icon={<Sparkles className="size-6" aria-hidden="true" />}
      title={title}
      description={description}
    />
  );
}

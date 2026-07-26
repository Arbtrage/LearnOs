import { Library } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

type WorkspaceEmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function WorkspaceEmptyState({
  title,
  description,
  action,
}: WorkspaceEmptyStateProps) {
  return (
    <EmptyState
      icon={<Library className="size-6" aria-hidden="true" />}
      title={title}
      description={description}
      action={action}
    />
  );
}

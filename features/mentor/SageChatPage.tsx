"use client";

import { useSearchParams } from "next/navigation";
import { SageChat } from "@/features/mentor/SageChat";

type SageChatPageProps = {
  projectId: string;
  userName?: string | null;
  defaultSection?: string;
};

export function SageChatPage({ projectId, userName, defaultSection }: SageChatPageProps) {
  const searchParams = useSearchParams();
  const fromSection = searchParams.get("from") ?? defaultSection;

  return (
    <div className="-mx-6 -my-5 flex h-[calc(100vh-3rem)] min-h-0 flex-col">
      <SageChat
        projectId={projectId}
        userName={userName}
        section={fromSection ?? undefined}
      />
    </div>
  );
}

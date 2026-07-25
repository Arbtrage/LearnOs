"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";

type ExamCountdownBannerProps = {
  projectId: string;
};

export function ExamCountdownBanner({ projectId }: ExamCountdownBannerProps) {
  const query = useQuery({
    queryKey: ["exam-profile", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/exam`);
      if (!res.ok) return null;
      return res.json() as Promise<{ profile: {
        examName: string;
        examDate: string;
        daysRemaining: number;
      } | null }>;
    },
  });

  const profile = query.data?.profile;
  if (!profile?.examDate) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <CalendarClock className="size-5 shrink-0 text-primary" />
      <div>
        <p className="font-medium">{profile.examName}</p>
        <p className="text-muted-foreground">
          {profile.daysRemaining} day{profile.daysRemaining === 1 ? "" : "s"} until exam
          · {new Date(profile.examDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

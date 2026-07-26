"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { PendingButton } from "@/components/common/PendingButton";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ReadinessGauge } from "@/features/exam/ReadinessGauge";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import type { ExamProfileDto } from "@/types/exam";
import type { MockExamDto } from "@/types/mock-exam";

type ExamPageProps = {
  projectId: string;
  projectSlug: string;
  topics: Array<{ id: string; title: string }>;
};

export function ExamPage({ projectId, projectSlug, topics }: ExamPageProps) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<{
    examName: string;
    examDate: string;
    sectionTitle: string;
    sectionWeight: number;
    selectedTopicIds: string[];
  } | null>(null);

  const examQuery = useQuery({
    queryKey: ["exam", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/exam`);
      if (!res.ok) throw new Error("Failed to load exam");
      const data = (await res.json()) as { profile: ExamProfileDto | null };
      return data.profile;
    },
  });

  const profile = examQuery.data;
  const form = draft ?? {
    examName: profile?.examName ?? "",
    examDate: profile?.examDate ?? "",
    sectionTitle: profile?.sections[0]?.title ?? "Section 1",
    sectionWeight: profile?.sections[0]?.weightPercent ?? 100,
    selectedTopicIds: profile?.sections[0]?.topicIds ?? [],
  };

  const setForm = (patch: Partial<typeof form>) => {
    setDraft({ ...form, ...patch });
  };

  const readinessQuery = useQuery({
    queryKey: ["readiness", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/readiness`);
      if (!res.ok) throw new Error("Failed to load readiness");
      return res.json();
    },
  });

  const mocksQuery = useQuery({
    queryKey: ["mock-exams", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/mock-exams`);
      if (!res.ok) throw new Error("Failed to load mocks");
      const data = (await res.json()) as { mockExams: MockExamDto[] };
      return data.mockExams;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/exam`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName: form.examName,
          examDate: form.examDate,
          sections: [
            {
              title: form.sectionTitle,
              weightPercent: form.sectionWeight,
              topicIds: form.selectedTopicIds.length
                ? form.selectedTopicIds
                : topics.map((t) => t.id),
              order: 0,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json() as Promise<ExamProfileDto>;
    },
    onSuccess: () => {
      setDraft(null);
      void examQuery.refetch();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/mock-exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionCount: 15 }),
      });
      if (!res.ok) throw new Error("Failed to generate mock");
      return res.json() as Promise<MockExamDto>;
    },
    onSuccess: () => void mocksQuery.refetch(),
  });

  const startMockMutation = useMutation({
    mutationFn: async (mockExamId: string) => {
      const res = await fetch(`/api/mock-exams/${mockExamId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to start");
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (attempt) => {
      router.push(`/projects/${projectSlug}/mock-exams/${attempt.id}`);
    },
  });

  if (examQuery.isLoading) return <LoadingState label="Loading exam profile..." />;

  const mocks = mocksQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam"
        description="Set your exam date, section weights, and track readiness with mock tests."
      />

      {readinessQuery.data ? (
        <ReadinessGauge readiness={readinessQuery.data} />
      ) : null}

      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {profile.examName} — {profile.daysRemaining} days remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.cramModeEnabled ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Cram mode active — your daily plan prioritizes weak high-weight topics.
              </p>
            ) : null}
            <Progress
              className="mt-3 h-2"
              value={Math.max(0, 100 - (profile.daysRemaining / 90) * 100)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exam setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Exam name"
            value={form.examName}
            onChange={(e) => setForm({ examName: e.target.value })}
          />
          <Input
            type="date"
            value={form.examDate}
            onChange={(e) => setForm({ examDate: e.target.value })}
          />
          <Input
            placeholder="Section title"
            value={form.sectionTitle}
            onChange={(e) => setForm({ sectionTitle: e.target.value })}
          />
          <Input
            type="number"
            min={1}
            max={100}
            value={form.sectionWeight}
            onChange={(e) => setForm({ sectionWeight: Number(e.target.value) })}
            placeholder="Weight %"
          />
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={form.selectedTopicIds.includes(t.id) ? "default" : "outline"}
                onClick={() =>
                  setForm({
                    selectedTopicIds: form.selectedTopicIds.includes(t.id)
                      ? form.selectedTopicIds.filter((id) => id !== t.id)
                      : [...form.selectedTopicIds, t.id],
                  })
                }
              >
                {t.title}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Unmapped topics use lowest priority in the planner.
          </p>
          <PendingButton
            onClick={() => saveMutation.mutate()}
            pending={saveMutation.isPending}
            pendingLabel="Saving…"
          >
            Save exam profile
          </PendingButton>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Mock exams</h2>
          <PendingButton
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            pending={generateMutation.isPending}
            pendingLabel="Generating…"
          >
            Generate mock exam
          </PendingButton>
        </div>
        {mocks.length === 0 ? (
          <WorkspaceEmptyState
            title="No mock exams yet"
            description="Generate a cross-topic mock exam to simulate test day."
          />
        ) : (
          <ul className="space-y-2">
            {mocks.map((mock) => (
              <li key={mock.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{mock.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {mock.questionCount} questions · {mock.timeLimitMinutes} min
                    {mock.lastScorePercent != null ? ` · Last: ${mock.lastScorePercent}%` : ""}
                  </p>
                </div>
                <PendingButton
                  size="sm"
                  onClick={() => startMockMutation.mutate(mock.id)}
                  pending={startMockMutation.isPending}
                  pendingLabel="Starting…"
                >
                  Start
                </PendingButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { requireSession } from "@/lib/auth/session";

type PageProps = {
  params: Promise<{ slug: string; attemptId: string }>;
};

export default async function PracticeAttemptPage({ params }: PageProps) {
  await requireSession();
  const { slug, attemptId } = await params;
  const { PracticeRunnerPage } = await import(
    "@/features/practice/PracticeRunnerPage"
  );
  return <PracticeRunnerPage projectSlug={slug} attemptId={attemptId} />;
}

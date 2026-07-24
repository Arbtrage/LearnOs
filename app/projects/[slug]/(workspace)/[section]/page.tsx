import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { WorkspaceEmptyState } from "@/features/workspace/WorkspaceEmptyState";
import { requireSession } from "@/lib/auth/session";
import { SIDEBAR_ROUTES } from "@/types/blueprint";
import { WorkspaceService } from "@/server/services/workspace.service";

const SECTION_COPY: Record<string, { title: string; description: string }> = {
  roadmap: {
    title: "Roadmap",
    description: "Your staged learning path will appear here once Phase 3 roadmap features ship.",
  },
  topics: {
    title: "Topics",
    description: "Topic mastery and knowledge graph views are coming in a future phase.",
  },
  practice: {
    title: "Practice",
    description: "Interactive practice sessions will be added in Phase 3+.",
  },
  revision: {
    title: "Revision",
    description: "Spaced repetition and revision queues arrive in Phase 4.",
  },
  notes: {
    title: "Notes",
    description: "Capture insights and link them to topics — planned for Phase 3.",
  },
  resources: {
    title: "Resources",
    description: "Curated resources from your blueprint will surface here soon.",
  },
  analytics: {
    title: "Analytics",
    description: "Progress analytics and learning insights are on the roadmap.",
  },
  mentor: {
    title: "Mentor",
    description: "Use the AI Mentor panel on the right for coaching and planning.",
  },
};

type PageProps = {
  params: Promise<{ slug: string; section: string }>;
};

export default async function WorkspaceSectionPage({ params }: PageProps) {
  const session = await requireSession();
  const { slug, section } = await params;

  if (section === "today" || section === "onboarding") {
    notFound();
  }

  const workspace = await WorkspaceService.getWorkspace(session.user.id, slug);
  if (!workspace) {
    notFound();
  }

  const allowed = SIDEBAR_ROUTES.filter((r) => r !== "overview" && r !== "today");
  if (!allowed.includes(section as (typeof allowed)[number])) {
    notFound();
  }

  const copy = SECTION_COPY[section] ?? {
    title: section.charAt(0).toUpperCase() + section.slice(1),
    description: "This section is coming soon.",
  };

  return (
    <div className="space-y-6">
      <PageHeader title={copy.title} description={copy.description} />
      <WorkspaceEmptyState title={`${copy.title} coming soon`} description={copy.description} />
    </div>
  );
}

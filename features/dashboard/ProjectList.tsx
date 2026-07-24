import { ProjectCard } from "@/features/dashboard/ProjectCard";
import { dashboard } from "@/constants/design";

type ProjectListProps = {
  projects: Array<{
    id: string;
    slug: string;
    title: string;
    goal: string;
    category: string | null;
    status: string;
    icon: string | null;
    accentColor: string | null;
    updatedAt: Date;
  }>;
};

export function ProjectList({ projects }: ProjectListProps) {
  const sorted = [...projects].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

  return (
    <div className={dashboard.projectGrid}>
      {sorted.map((project) => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </div>
  );
}

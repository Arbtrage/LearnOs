import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string; section: string }>;
};

export default async function WorkspaceSectionPage({ params }: PageProps) {
  const { slug, section } = await params;

  if (section === "mentor") {
    redirect(`/projects/${slug}/mentor`);
  }

  if (section === "analytics") {
    redirect(`/projects/${slug}/analytics`);
  }

  notFound();
}

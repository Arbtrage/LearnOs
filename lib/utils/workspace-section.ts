import { groupSidebarItems } from "@/lib/navigation/learning-framework";

type SidebarItemLike = {
  label: string;
  route: string;
  order: number;
  sectionKey?: string;
  icon?: string;
  id?: string;
};

export function resolveSectionLabel(
  pathname: string,
  slug: string,
  items: SidebarItemLike[],
): string {
  const base = `/projects/${slug}`;
  let route = "overview";
  if (pathname !== base) {
    route = pathname.slice(base.length + 1).split("/")[0] ?? "overview";
  }

  const grouped = groupSidebarItems(
    items.map((item, index) => ({
      id: item.id ?? `${item.route}-${index}`,
      label: item.label,
      icon: item.icon ?? item.route,
      route: item.route,
      order: item.order,
      sectionKey: item.sectionKey,
    })),
  );

  for (const section of grouped) {
    const match = section.items.find((item) => item.route === route);
    if (match) return match.label;
  }

  return route.charAt(0).toUpperCase() + route.slice(1);
}

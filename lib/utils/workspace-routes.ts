export function buildSidebarHref(slug: string, route: string): string {
  if (route === "overview") {
    return `/projects/${slug}`;
  }
  return `/projects/${slug}/${route}`;
}

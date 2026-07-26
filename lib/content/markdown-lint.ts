export type MarkdownLintResult = {
  ok: boolean;
  issues: string[];
};

export function lintLessonSectionMarkdown(bodyMarkdown: string): MarkdownLintResult {
  const issues: string[] = [];
  const trimmed = bodyMarkdown.trim();

  if (trimmed.startsWith("# ")) {
    issues.push("Section body must not start with H1 (# heading).");
  }

  const hasSubheading = /^#{2,4}\s/m.test(trimmed);
  if (!hasSubheading) {
    issues.push("Section must include at least one subheading (### or ####).");
  }

  if (/[^\n]\s#{2,6}\s/.test(trimmed)) {
    issues.push("Headings must start on their own line (not inline after text).");
  }

  const hasList = /^(\s*[-*]|\s*\d+\.)\s/m.test(trimmed);
  if (!hasList) {
    issues.push("Section must include at least one bullet or numbered list.");
  }

  return { ok: issues.length === 0, issues };
}

export function lintLessonSections(
  sections: Array<{ title: string; bodyMarkdown: string; order: number }>,
): MarkdownLintResult {
  const issues: string[] = [];

  if (sections.length < 2) {
    issues.push("Lesson must include at least 2 sections.");
  }

  const orders = sections.map((section) => section.order).sort((a, b) => a - b);
  for (let index = 0; index < orders.length; index += 1) {
    if (orders[index] !== index) {
      issues.push("Section order values must be contiguous starting at 0.");
      break;
    }
  }

  for (const section of sections) {
    const result = lintLessonSectionMarkdown(section.bodyMarkdown);
    if (!result.ok) {
      issues.push(`${section.title}: ${result.issues.join(" ")}`);
    }
  }

  return { ok: issues.length === 0, issues };
}

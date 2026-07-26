/**
 * Normalize AI-generated markdown before rendering or persistence.
 * Fixes escaped newlines, collapsed block tokens, fences, and indentation.
 */
export function normalizeMarkdownInput(markdown: string): string {
  if (!markdown) return "";

  let text = markdown.trim();

  // Literal \n from JSON instead of real line breaks.
  if (text.includes("\\n")) {
    text = text.replace(/\\n/g, "\n");
  }
  text = text.replace(/\\t/g, "\t");

  // Unescape common over-escaped markdown tokens from model output.
  text = text.replace(/\\([#*_`[\]()>-])/g, "$1");

  // Strip accidental markdown code fences wrapping the whole lesson.
  const fenceMatch = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i);
  if (fenceMatch) {
    text = fenceMatch[1]!.trim();
  }

  text = dedentMarkdown(text);
  text = insertBlockNewlines(text);

  return text.trim();
}

/** Remove uniform leading indentation so content is not parsed as one code block. */
function dedentMarkdown(text: string): string {
  const lines = text.split("\n");
  const contentLines = lines.filter((line) => line.trim().length > 0);
  if (contentLines.length === 0) return text;

  const indents = contentLines
    .map((line) => {
      const match = line.match(/^(\s*)/);
      return match ? match[1]!.length : 0;
    })
    .filter((n) => n > 0);

  if (indents.length === 0) return text;

  const minIndent = Math.min(...indents);
  // Only dedent when most lines share significant leading space (AI JSON indent).
  if (minIndent < 2) return text;

  return lines
    .map((line) => (line.length >= minIndent ? line.slice(minIndent) : line))
    .join("\n");
}

/**
 * AI models often emit block markdown inline (e.g. "...content. ## Next ### Sub").
 * Headings and lists must start on their own line to parse correctly.
 */
function insertBlockNewlines(text: string): string {
  let result = text;

  result = result.replace(/([.!?])\s*(#{2,6}\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(#{2,6}\s)/g, "$1\n\n$2");
  result = result.replace(/([.!?])\s+(-\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(-\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(>\s)/g, "$1\n\n$2");
  result = result.replace(/([.!?])\s+(\d+\.\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(\d+\.\s)/g, "$1\n\n$2");

  return result;
}

"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createNoteEditorExtensions,
  type MarkdownStorage,
} from "@/features/notes/notes-editor/extensions";
import { normalizeMarkdownInput } from "@/lib/content/normalize-markdown";
import { cn } from "@/lib/utils";

type NoteEditorProps = {
  bodyMarkdown: string;
  onChange: (markdown: string) => void;
  className?: string;
};

export function getMarkdownFromEditor(editor: ReturnType<typeof useEditor>) {
  if (!editor) return "";
  const storage = editor.storage as unknown as MarkdownStorage;
  return storage.markdown?.getMarkdown?.() ?? "";
}

export function NoteEditor({ bodyMarkdown, onChange, className }: NoteEditorProps) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const lastExternalBody = React.useRef(bodyMarkdown);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createNoteEditorExtensions(),
    content: bodyMarkdown,
    editorProps: {
      attributes: {
        class:
          "prose prose-base dark:prose-invert max-w-none min-h-[280px] focus:outline-none px-1 py-2",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = normalizeMarkdownInput(getMarkdownFromEditor(ed));
      lastExternalBody.current = md;
      onChangeRef.current(md);
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const normalized = normalizeMarkdownInput(bodyMarkdown);
    if (normalized === lastExternalBody.current) return;
    lastExternalBody.current = normalized;
    editor.commands.setContent(normalized);
  }, [bodyMarkdown, editor]);

  if (!editor) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function EditorToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const items = [
    {
      label: "Bold",
      icon: Bold,
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading 1",
      icon: Heading1,
      active: editor.isActive("heading", { level: 1 }),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      active: editor.isActive("heading", { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Bullet list",
      icon: List,
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Ordered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Task list",
      icon: ListTodo,
      active: editor.isActive("taskList"),
      action: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      label: "Link",
      icon: LinkIcon,
      active: editor.isActive("link"),
      action: setLink,
    },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border bg-muted/20 p-1">
      {items.map(({ label, icon: Icon, active, action }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn("size-8", active && "bg-background shadow-sm")}
          aria-label={label}
          aria-pressed={active}
          onClick={action}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      ))}
    </div>
  );
}

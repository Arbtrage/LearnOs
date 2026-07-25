"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FOCUS_SHORTCUTS,
  GLOBAL_SHORTCUTS,
  PRACTICE_SHORTCUTS,
  type ShortcutDefinition,
} from "@/lib/keyboard/shortcuts";

type ShortcutHelpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ShortcutGroup({
  title,
  items,
}: {
  title: string;
  items: ShortcutDefinition[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{item.description}</span>
            <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">
              {item.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShortcutHelpModal({ open, onOpenChange }: ShortcutHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ShortcutGroup title="Global" items={GLOBAL_SHORTCUTS} />
          <ShortcutGroup title="Focus" items={FOCUS_SHORTCUTS} />
          <ShortcutGroup title="Practice" items={PRACTICE_SHORTCUTS} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw, type LucideIcon } from "lucide-react";

type LoopNode = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type LoopDiagramProps = {
  nodes: LoopNode[];
  activeId?: string;
  onSelect?: (id: string) => void;
};

/**
 * Horizontal cycle diagram: five nodes on a dashed track with a travelling
 * pulse, plus a dashed return arc that closes the loop.
 */
export function LoopDiagram({ nodes, activeId, onSelect }: LoopDiagramProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="hidden md:block">
      <div className="relative">
        <div
          className="absolute left-[8%] right-[8%] top-6 border-t-2 border-dashed border-primary/25"
          aria-hidden
        />
        {!reduceMotion ? (
          <motion.span
            className="absolute top-6 size-2 -translate-y-1/2 rounded-full gradient-primary shadow-glow"
            style={{ left: "8%" }}
            animate={{ left: ["8%", "92%"] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            aria-hidden
          />
        ) : null}
        <div className="relative z-10 flex justify-between px-[4%]">
          {nodes.map((node) => {
            const active = node.id === activeId;
            const Icon = node.icon;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelect?.(node.id)}
                className="group flex flex-col items-center gap-2"
                aria-pressed={active}
              >
                <span
                  className={`grid size-12 place-items-center rounded-full border-2 bg-background transition-colors ${
                    active
                      ? "border-primary text-primary shadow-glow"
                      : "border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span
                  className={`text-xs font-medium transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {node.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Return arc: last node feeds back into the first. */}
      <div className="relative mx-[8%] mt-3" aria-hidden>
        <div className="h-8 rounded-b-full border-x-2 border-b-2 border-dashed border-primary/20" />
        <div className="absolute -left-1 -top-1 text-primary/40">
          <RotateCcw className="size-4 -rotate-45" />
        </div>
        <span className="absolute inset-x-0 -bottom-2.5 mx-auto w-fit bg-background px-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Repeats every day
        </span>
      </div>
    </div>
  );
}

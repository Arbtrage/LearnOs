"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROJECT_TEMPLATES } from "@/constants/project-templates";
import { TemplateCard } from "@/features/projects/create/TemplateCard";
import {
  emptyCustomDraft,
  isDraftValid,
  type ProjectDraft,
} from "@/features/projects/create/types";
import { pageEnter, staggerContainer } from "@/lib/utils/motion";
import { cn } from "@/lib/utils";

type CreateProjectStepChooseProps = {
  draft: ProjectDraft | null;
  onDraftChange: (draft: ProjectDraft) => void;
  onContinue: () => void;
  reducedMotion?: boolean;
};

export function CreateProjectStepChoose({
  draft,
  onDraftChange,
  onContinue,
  reducedMotion = false,
}: CreateProjectStepChooseProps) {
  const [search, setSearch] = useState("");
  const [customOpen, setCustomOpen] = useState(draft?.source === "custom");
  const [customTitle, setCustomTitle] = useState(
    draft?.source === "custom" ? draft.title : "",
  );
  const [customGoal, setCustomGoal] = useState(
    draft?.source === "custom" ? draft.goal : "",
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PROJECT_TEMPLATES;
    return PROJECT_TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.goal.toLowerCase().includes(query),
    );
  }, [search]);

  const customDraftValid =
    customTitle.trim().length > 0 && customGoal.trim().length > 0;
  const canContinue = customOpen
    ? customDraftValid
    : draft?.source === "template" && isDraftValid(draft);

  const handleTemplateSelect = (template: (typeof PROJECT_TEMPLATES)[number]) => {
    setCustomOpen(false);
    onDraftChange({
      title: template.title,
      goal: template.goal,
      category: template.category,
      icon: template.icon,
      accentColor: template.accentColor,
      source: "template",
    });
  };

  const handleCustomToggle = () => {
    setCustomOpen((open) => !open);
    if (!customOpen) {
      onDraftChange({
        ...emptyCustomDraft,
        title: customTitle,
        goal: customGoal,
      });
    }
  };

  const handleCustomChange = (field: "title" | "goal", value: string) => {
    if (field === "title") setCustomTitle(value);
    else setCustomGoal(value);

    onDraftChange({
      ...emptyCustomDraft,
      title: field === "title" ? value : customTitle,
      goal: field === "goal" ? value : customGoal,
    });
  };

  const handleContinue = useCallback(() => {
    if (customOpen && customDraftValid) {
      onDraftChange({
        ...emptyCustomDraft,
        title: customTitle.trim(),
        goal: customGoal.trim(),
      });
    }
    onContinue();
  }, [
    customOpen,
    customDraftValid,
    customTitle,
    customGoal,
    onDraftChange,
    onContinue,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        canContinue &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canContinue, handleContinue]);

  const HeroWrapper = reducedMotion ? "div" : motion.div;
  const GridWrapper = reducedMotion ? "div" : motion.div;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HeroWrapper
        {...(!reducedMotion && { ...pageEnter })}
        className="mx-auto w-full max-w-3xl space-y-3 px-4 pt-8 text-center sm:px-6 sm:pt-12"
      >
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          What will you master next?
        </h1>
        <p className="text-muted-foreground">
          Choose a path or describe your own goal — AI will interview you and
          build your learning blueprint.
        </p>
      </HeroWrapper>

      <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6">
        <div className="relative">
          <Search
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={searchRef}
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams, languages, certifications..."
            className="h-12 rounded-xl pl-11 text-base shadow-sm"
            aria-label="Search learning templates"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <GridWrapper
          {...(!reducedMotion && {
            variants: staggerContainer,
            initial: "initial",
            animate: "animate",
          })}
          role="radiogroup"
          aria-label="Learning templates"
          className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.title}
              template={template}
              selected={
                draft?.source === "template" && draft.title === template.title
              }
              onSelect={() => handleTemplateSelect(template)}
              reducedMotion={reducedMotion}
            />
          ))}
        </GridWrapper>

        {filteredTemplates.length === 0 ? (
          <p className="mx-auto mt-6 max-w-md text-center text-sm text-muted-foreground">
            No templates match your search. Try a different keyword or describe
            your own goal below.
          </p>
        ) : null}

        <div className="mx-auto mt-10 max-w-2xl">
          <button
            type="button"
            onClick={handleCustomToggle}
            className="flex w-full items-center justify-center gap-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={customOpen}
          >
            <span className="h-px flex-1 bg-border" />
            <span>Or describe your own goal</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                customOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
            <span className="h-px flex-1 bg-border" />
          </button>

          {customOpen ? (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-4 rounded-xl border border-border bg-card/50 p-4 sm:p-6"
            >
              <div className="space-y-2">
                <Label htmlFor="custom-title">Project title</Label>
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(e) => handleCustomChange("title", e.target.value)}
                  placeholder="e.g. Learn Rust"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-goal">Learning goal</Label>
                <textarea
                  id="custom-goal"
                  value={customGoal}
                  onChange={(e) => handleCustomChange("goal", e.target.value)}
                  placeholder="Describe what you want to learn and achieve..."
                  className="flex min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-5xl justify-end">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!canContinue}
            aria-disabled={!canContinue}
            className="min-w-36"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

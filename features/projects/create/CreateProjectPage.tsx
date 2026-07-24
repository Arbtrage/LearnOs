"use client";

import { CreateProjectComposer } from "@/features/projects/create/CreateProjectComposer";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function CreateProjectPage() {
  const reducedMotion = useReducedMotion();
  return <CreateProjectComposer reducedMotion={reducedMotion} />;
}

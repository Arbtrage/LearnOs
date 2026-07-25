import type { z } from "zod";
import {
  createResourceSchema,
  updateResourceSchema,
} from "@/types/resources";

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

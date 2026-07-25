import { z } from "zod";

export const updateProjectSchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

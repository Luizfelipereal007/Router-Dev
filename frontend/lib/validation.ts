import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
});

export const linkSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  terminal: z.boolean(),
});

import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const monthRegex = /^\d{4}-\d{2}$/;

export const createEntrySchema = z.object({
  entryDate: z.string().regex(dateRegex, "entryDate must be YYYY-MM-DD"),
  title: z.string().min(1).max(100),
  note: z.string().max(2000).optional(),
  activityId: z.string().uuid().optional(),
});

export const updateEntrySchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    note: z.string().max(2000).optional(),
    activityId: z.string().uuid().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required",
  });

export const createActivitySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().min(4).max(20),
  isPreset: z.boolean().optional(),
});

export const updateActivitySchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().min(4).max(20).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required",
  });

export const monthQuerySchema = z.object({
  month: z.string().regex(monthRegex, "month must be YYYY-MM"),
});

export const dateParamSchema = z.object({
  date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
});

export const statsQuerySchema = z.object({
  activityId: z.string().uuid(),
});

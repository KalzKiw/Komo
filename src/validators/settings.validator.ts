import { z } from "zod";

const timePattern = /^\d{1,2}:\d{2}$/;

export const updateScheduleBodySchema = z.object({
  morning: z.string().regex(timePattern, "Formato HH:MM requerido").optional(),
  afternoon: z.string().regex(timePattern, "Formato HH:MM requerido").optional(),
  night: z.string().regex(timePattern, "Formato HH:MM requerido").optional(),
  graceMinutes: z.coerce.number().int().min(0).max(60).optional()
});

export type UpdateScheduleBody = z.infer<typeof updateScheduleBodySchema>;

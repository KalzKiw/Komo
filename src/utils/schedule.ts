import { OrderShift } from "../types/domain";

/**
 * Builds the cancellation deadline ISO string for an order.
 * @param scheduledFor  Date string in "YYYY-MM-DD" format.
 * @param shift         Order shift.
 * @param cutoffHour    Hour of the shift cutoff (0-23).
 * @param cutoffMinute  Minute of the shift cutoff (0-59).
 * @param graceMinutes  Grace period added on top of the cutoff.
 */
export function buildCancellationDeadline(
  scheduledFor: string,
  shift: OrderShift,
  cutoffHour: number,
  cutoffMinute: number,
  graceMinutes: number
): string {
  const date = new Date(`${scheduledFor}T00:00:00`);
  date.setHours(cutoffHour, cutoffMinute + graceMinutes, 0, 0);
  return date.toISOString();
}

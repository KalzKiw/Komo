import { describe, expect, it } from "vitest";
import { buildCancellationDeadline } from "../schedule";

describe("buildCancellationDeadline", () => {
  it("builds deadline for MORNING shift (9:00 + 5 grace = 9:05)", () => {
    const result = buildCancellationDeadline("2026-04-02", "MORNING", 9, 0, 5);
    const date = new Date(result);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(5);
    expect(date.getSeconds()).toBe(0);
  });

  it("builds deadline for AFTERNOON shift (15:00 + 5 grace = 15:05)", () => {
    const result = buildCancellationDeadline("2026-04-02", "AFTERNOON", 15, 0, 5);
    const date = new Date(result);
    expect(date.getHours()).toBe(15);
    expect(date.getMinutes()).toBe(5);
  });

  it("handles minute overflow (58 + 5 = 03 of next hour)", () => {
    const result = buildCancellationDeadline("2026-04-02", "MORNING", 8, 58, 5);
    const date = new Date(result);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(3);
  });

  it("returns correct date part", () => {
    const result = buildCancellationDeadline("2026-04-15", "NIGHT", 18, 0, 5);
    const date = new Date(result);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(3); // April = index 3
    expect(date.getDate()).toBe(15);
  });

  it("returns a valid ISO string", () => {
    const result = buildCancellationDeadline("2026-04-02", "MORNING", 9, 0, 5);
    expect(() => new Date(result)).not.toThrow();
    expect(typeof result).toBe("string");
  });
});

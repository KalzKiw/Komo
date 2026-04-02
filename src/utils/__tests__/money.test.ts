import { describe, expect, it } from "vitest";
import { roundMoney } from "../money";

describe("roundMoney", () => {
  it("returns 0 for 0", () => {
    expect(roundMoney(0)).toBe(0);
  });

  it("rounds to 2 decimal places (half-up)", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(1.235)).toBe(1.24);
    expect(roundMoney(2.455)).toBe(2.46);
  });

  it("does not alter values already with 2 decimals", () => {
    expect(roundMoney(2.50)).toBe(2.50);
    expect(roundMoney(10.99)).toBe(10.99);
  });

  it("handles floating-point imprecision (e.g. 0.1 + 0.2)", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.30);
  });

  it("handles large values", () => {
    expect(roundMoney(1234.5678)).toBe(1234.57);
  });
});

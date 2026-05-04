import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthUser } from "../../types/domain";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("../../config", () => ({
  supabase: {
    from: fromMock,
  },
}));

import { topUpChildWallet } from "../family.service";

function builder(result: Record<string, unknown>, onUpdate?: (payload: unknown) => void) {
  const api = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn((payload: unknown) => {
      onUpdate?.(payload);
      return api;
    }),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
  };
  return api;
}

const parent: AuthUser = {
  id: "parent-1",
  role: "PARENT",
  isBeneficiary: false,
};

describe("topUpChildWallet", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("rolls back the balance when the wallet transaction cannot be persisted", async () => {
    const updates: unknown[] = [];
    const linkBuilder = builder({ data: { id: "link-1" }, error: null });
    const studentBuilder = builder({ data: { wallet_balance: 5, role: "STUDENT" }, error: null });
    const updateBuilder = builder({ data: { wallet_balance: 15 }, error: null }, (payload) => updates.push(payload));
    const transactionBuilder = {
      insert: vi.fn().mockResolvedValue({ error: new Error("missing table") }),
    };
    const rollbackBuilder = builder({ data: null, error: null }, (payload) => updates.push(payload));

    fromMock
      .mockReturnValueOnce(linkBuilder)
      .mockReturnValueOnce(studentBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(transactionBuilder)
      .mockReturnValueOnce(rollbackBuilder);

    await expect(topUpChildWallet(parent, "student-1", 10)).rejects.toThrow(
      "No se pudo registrar el movimiento del monedero"
    );

    expect(updates).toEqual([
      { wallet_balance: 15 },
      { wallet_balance: 5 },
    ]);
  });
});

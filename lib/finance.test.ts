import { describe, expect, it } from "vitest";
import { budgetStatus, calculateGoalProgress, requiredMonthlyContribution, sumByKind } from "./finance";

describe("finance calculations", () => {
  it("calculates goal progress and caps it at 100", () => {
    expect(calculateGoalProgress({ current: 25, target: 100 })).toBe(25);
    expect(calculateGoalProgress({ current: 120, target: 100 })).toBe(100);
  });

  it("calculates the required monthly contribution", () => {
    expect(requiredMonthlyContribution(0, 1200, "2027-01-01", new Date("2026-07-01"))).toBeGreaterThan(190);
    expect(requiredMonthlyContribution(1200, 1200, "2027-01-01", new Date("2026-07-01"))).toBe(0);
  });

  it("sums incomes and expenses independently", () => {
    expect(sumByKind([{ amount: 100, kind: "income" }, { amount: 30, kind: "expense" }])).toEqual({ income: 100, expense: 30 });
  });

  it("returns traffic-light budget states", () => {
    expect(budgetStatus(500, 1000)).toBe("green");
    expect(budgetStatus(800, 1000)).toBe("yellow");
    expect(budgetStatus(1000, 1000)).toBe("red");
  });
});

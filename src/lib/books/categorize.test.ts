import { describe, expect, it } from "vitest";
import { ruleBasedCategory, type CategoryAccount } from "./categorize";

const accounts: CategoryAccount[] = [
  { id: "a1", code: "5000", name: "Fuel" },
  { id: "a2", code: "5100", name: "Vehicle Maintenance & Repairs" },
  { id: "a3", code: "5200", name: "Commercial Auto Insurance" },
  { id: "a4", code: "5300", name: "Tolls & Parking" },
  { id: "a5", code: "5600", name: "Software & Subscriptions" },
  { id: "a6", code: "6000", name: "Bank & Merchant Fees" },
  { id: "a7", code: "6200", name: "Licenses & Permits" },
  { id: "a8", code: "6900", name: "Miscellaneous Expense" },
];

describe("ruleBasedCategory", () => {
  it("categorizes fuel purchases", () => {
    expect(ruleBasedCategory("Shell gas station fill-up", accounts)?.code).toBe(
      "5000",
    );
    expect(ruleBasedCategory("DIESEL for van #2", accounts)?.code).toBe("5000");
  });

  it("categorizes vehicle maintenance", () => {
    expect(ruleBasedCategory("Oil change at Jiffy Lube", accounts)?.code).toBe(
      "5100",
    );
    expect(ruleBasedCategory("new tires front axle", accounts)?.code).toBe(
      "5100",
    );
  });

  it("categorizes tolls and parking", () => {
    expect(ruleBasedCategory("E-ZPass replenishment", accounts)?.code).toBe(
      "5300",
    );
    expect(ruleBasedCategory("Parking garage midtown", accounts)?.code).toBe(
      "5300",
    );
  });

  it("categorizes software subscriptions", () => {
    expect(ruleBasedCategory("Vercel monthly subscription", accounts)?.code).toBe(
      "5600",
    );
  });

  it("categorizes insurance ahead of generic matches", () => {
    expect(
      ruleBasedCategory("Progressive commercial insurance premium payment", accounts)
        ?.code,
    ).toBe("5200");
  });

  it("categorizes bank fees", () => {
    expect(ruleBasedCategory("Stripe fee for March", accounts)?.code).toBe(
      "6000",
    );
  });

  it("categorizes TLC/DMV items as licenses", () => {
    expect(ruleBasedCategory("TLC vehicle registration renewal", accounts)?.code).toBe(
      "6200",
    );
  });

  it("falls back to miscellaneous for unknown text", () => {
    expect(ruleBasedCategory("mystery purchase xyz", accounts)?.code).toBe(
      "6900",
    );
  });

  it("skips rules whose account is missing and still returns something", () => {
    const onlyMisc: CategoryAccount[] = [
      { id: "m", code: "6900", name: "Miscellaneous Expense" },
    ];
    expect(ruleBasedCategory("Shell gasoline", onlyMisc)?.code).toBe("6900");
  });

  it("returns null with no accounts", () => {
    expect(ruleBasedCategory("anything", [])).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  findMatches,
  fingerprint,
  normalizeAmount,
  normalizeDate,
  parseBankCsv,
  parseCsv,
  type MatchCandidate,
} from "./bank-import";

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with commas and escaped quotes", () => {
    expect(parseCsv('a,"hello, world","say ""hi"""')).toEqual([
      ["a", "hello, world", 'say "hi"'],
    ]);
  });

  it("handles CRLF and skips blank lines", () => {
    expect(parseCsv("a,b\r\n\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("normalizeDate", () => {
  it("accepts ISO, US, and short-year formats", () => {
    expect(normalizeDate("2026-07-04")).toBe("2026-07-04");
    expect(normalizeDate("07/04/2026")).toBe("2026-07-04");
    expect(normalizeDate("7/4/26")).toBe("2026-07-04");
  });

  it("rejects garbage and impossible dates", () => {
    expect(normalizeDate("not a date")).toBeNull();
    expect(normalizeDate("13/45/2026")).toBeNull();
  });
});

describe("normalizeAmount", () => {
  it("parses plain and formatted amounts", () => {
    expect(normalizeAmount("1234.56")).toBe(123456);
    expect(normalizeAmount("$1,234.56")).toBe(123456);
    expect(normalizeAmount("-45.00")).toBe(-4500);
    expect(normalizeAmount("(45.00)")).toBe(-4500);
    expect(normalizeAmount("12.5")).toBe(1250);
    expect(normalizeAmount("100 CR")).toBe(10000);
    expect(normalizeAmount("100 DR")).toBe(-10000);
  });

  it("rejects non-numeric input", () => {
    expect(normalizeAmount("")).toBeNull();
    expect(normalizeAmount("abc")).toBeNull();
    expect(normalizeAmount("1.234")).toBeNull();
  });
});

describe("fingerprint", () => {
  it("is stable and whitespace/case-insensitive on description", () => {
    expect(fingerprint("2026-07-01", -4500, "SHELL  OIL 123")).toBe(
      fingerprint("2026-07-01", -4500, "shell oil 123"),
    );
  });

  it("differs when identity fields differ", () => {
    const base = fingerprint("2026-07-01", -4500, "shell");
    expect(fingerprint("2026-07-02", -4500, "shell")).not.toBe(base);
    expect(fingerprint("2026-07-01", -4600, "shell")).not.toBe(base);
    expect(fingerprint("2026-07-01", -4500, "exxon")).not.toBe(base);
  });
});

describe("parseBankCsv", () => {
  it("parses a Chase-style file with a signed Amount column", () => {
    const csv = [
      "Posting Date,Description,Amount,Balance",
      "07/01/2026,SHELL OIL 5744,-45.00,1200.00",
      '07/02/2026,"ZELLE FROM SUNRISE REHAB, LLC",350.00,1550.00',
    ].join("\n");
    const result = parseBankCsv(csv);
    if ("error" in result) throw new Error(result.error);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      txn_date: "2026-07-01",
      description: "SHELL OIL 5744",
      amount_cents: -4500,
    });
    expect(result.rows[1]).toMatchObject({
      txn_date: "2026-07-02",
      amount_cents: 35000,
    });
    expect(result.columns.amount).toBe("Amount");
  });

  it("parses a Debit/Credit column pair", () => {
    const csv = [
      "Date,Description,Debit,Credit",
      "2026-07-01,E-ZPASS REBILL,12.50,",
      "2026-07-03,DEPOSIT,,500.00",
    ].join("\n");
    const result = parseBankCsv(csv);
    if ("error" in result) throw new Error(result.error);
    expect(result.rows[0].amount_cents).toBe(-1250);
    expect(result.rows[1].amount_cents).toBe(50000);
  });

  it("keeps legitimate same-day duplicates distinct", () => {
    const csv = [
      "Date,Description,Amount",
      "2026-07-01,MTA VENDING,-2.90",
      "2026-07-01,MTA VENDING,-2.90",
    ].join("\n");
    const result = parseBankCsv(csv);
    if ("error" in result) throw new Error(result.error);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].fingerprint).not.toBe(result.rows[1].fingerprint);
  });

  it("reports skipped rows instead of failing the whole file", () => {
    const csv = [
      "Date,Description,Amount",
      "garbage,SOMETHING,10.00",
      "2026-07-01,REAL ROW,10.00",
    ].join("\n");
    const result = parseBankCsv(csv);
    if ("error" in result) throw new Error(result.error);
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
  });

  it("errors on files without usable columns", () => {
    const result = parseBankCsv("Foo,Bar\n1,2");
    expect("error" in result).toBe(true);
  });
});

describe("findMatches", () => {
  const candidates: MatchCandidate[] = [
    {
      entry_id: "e1",
      entry_number: 1,
      entry_date: "2026-07-01",
      memo: "Shell fill-up",
      bank_delta_cents: -4500,
    },
    {
      entry_id: "e2",
      entry_number: 2,
      entry_date: "2026-07-06",
      memo: "Another fill-up",
      bank_delta_cents: -4500,
    },
    {
      entry_id: "e3",
      entry_number: 3,
      entry_date: "2026-07-01",
      memo: "Deposit",
      bank_delta_cents: 35000,
    },
  ];

  it("matches on exact amount within the window, closest date first", () => {
    const matches = findMatches(
      { txn_date: "2026-07-02", amount_cents: -4500 },
      candidates,
    );
    expect(matches.map((m) => m.entry_id)).toEqual(["e1", "e2"]);
  });

  it("excludes entries outside the window", () => {
    const matches = findMatches(
      { txn_date: "2026-07-20", amount_cents: -4500 },
      candidates,
    );
    expect(matches).toEqual([]);
  });

  it("never matches across signs", () => {
    const matches = findMatches(
      { txn_date: "2026-07-01", amount_cents: 4500 },
      candidates,
    );
    expect(matches).toEqual([]);
  });
});

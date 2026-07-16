/**
 * Bank statement CSV parsing for AccessRide Books.
 *
 * Banks disagree on everything — column names, date formats, whether
 * money out is negative or lives in its own "Debit" column. This module
 * normalizes all of it into signed integer cents with a stable
 * fingerprint per row so re-imports never duplicate. Pure functions,
 * fully unit tested, shared with the mobile apps later.
 */

export type ParsedBankRow = {
  txn_date: string; // YYYY-MM-DD
  description: string;
  amount_cents: number; // signed: + money in, - money out
  fingerprint: string;
};

export type BankCsvResult = {
  rows: ParsedBankRow[];
  /** Human-readable notes for rows that could not be parsed. */
  skipped: string[];
  /** Which source columns were used, for the import preview. */
  columns: { date: string; description: string; amount: string };
};

// ---------------------------------------------------------------------
// CSV tokenizer (handles quoted fields, escaped quotes, CRLF)
// ---------------------------------------------------------------------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

// ---------------------------------------------------------------------
// Column detection
// ---------------------------------------------------------------------

const DATE_HEADERS = [
  "date",
  "posted date",
  "posting date",
  "transaction date",
  "trans date",
  "post date",
];
const DESC_HEADERS = [
  "description",
  "payee",
  "memo",
  "details",
  "transaction description",
  "name",
];
const AMOUNT_HEADERS = ["amount", "transaction amount", "amount (usd)"];
const DEBIT_HEADERS = ["debit", "withdrawal", "withdrawals", "money out"];
const CREDIT_HEADERS = ["credit", "deposit", "deposits", "money in"];

function findColumn(headers: string[], candidates: string[]): number {
  const lowered = headers.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const exact = lowered.indexOf(candidate);
    if (exact !== -1) return exact;
  }
  for (const candidate of candidates) {
    const partial = lowered.findIndex((h) => h.includes(candidate));
    if (partial !== -1) return partial;
  }
  return -1;
}

// ---------------------------------------------------------------------
// Value normalization
// ---------------------------------------------------------------------

/** Accepts YYYY-MM-DD, MM/DD/YYYY, M/D/YY and returns YYYY-MM-DD. */
export function normalizeDate(input: string): string | null {
  const value = input.trim();

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    const [, m, d, yRaw] = us;
    const year = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    const month = Number(m);
    const day = Number(d);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

/**
 * Parses statement amounts into signed cents. Handles "$1,234.56",
 * "-45.00", "(45.00)" (accounting negative), and trailing "CR"/"DR".
 */
export function normalizeAmount(input: string): number | null {
  let value = input.trim();
  if (!value) return null;

  let negative = false;
  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }
  if (/\bDR\b/i.test(value)) negative = true;
  value = value.replace(/\b(CR|DR)\b/gi, "");
  value = value.replace(/[$,\s]/g, "");
  if (value.startsWith("-")) {
    negative = true;
    value = value.slice(1);
  }
  if (value.startsWith("+")) value = value.slice(1);

  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(parseFloat(value) * 100);
  return negative ? -cents : cents;
}

/** Stable FNV-1a hash of the row identity, hex-encoded. */
export function fingerprint(
  txnDate: string,
  amountCents: number,
  description: string,
): string {
  const key = `${txnDate}|${amountCents}|${description.trim().toLowerCase().replace(/\s+/g, " ")}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // Two passes reduce collisions on short strings.
  let hash2 = 0x811c9dc5;
  for (let i = key.length - 1; i >= 0; i--) {
    hash2 ^= key.charCodeAt(i);
    hash2 = Math.imul(hash2, 0x01000193) >>> 0;
  }
  return `${hash.toString(16).padStart(8, "0")}${hash2.toString(16).padStart(8, "0")}`;
}

// ---------------------------------------------------------------------
// Statement parsing
// ---------------------------------------------------------------------

export function parseBankCsv(text: string): BankCsvResult | { error: string } {
  const grid = parseCsv(text);
  if (grid.length < 2) {
    return { error: "The file needs a header row and at least one transaction." };
  }

  const headers = grid[0];
  const dateCol = findColumn(headers, DATE_HEADERS);
  const descCol = findColumn(headers, DESC_HEADERS);
  const amountCol = findColumn(headers, AMOUNT_HEADERS);
  const debitCol = findColumn(headers, DEBIT_HEADERS);
  const creditCol = findColumn(headers, CREDIT_HEADERS);

  if (dateCol === -1) {
    return { error: "Could not find a date column (looked for Date, Posted Date…)." };
  }
  if (descCol === -1) {
    return { error: "Could not find a description column (Description, Payee, Memo…)." };
  }
  if (amountCol === -1 && (debitCol === -1 || creditCol === -1)) {
    return {
      error:
        "Could not find an Amount column or a Debit/Credit column pair.",
    };
  }

  const rows: ParsedBankRow[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < grid.length; i++) {
    const cells = grid[i];
    const rawDate = cells[dateCol] ?? "";
    const description = (cells[descCol] ?? "").trim();

    const txn_date = normalizeDate(rawDate);
    if (!txn_date) {
      skipped.push(`Row ${i + 1}: unrecognized date “${rawDate.trim()}”.`);
      continue;
    }

    let amount_cents: number | null = null;
    if (amountCol !== -1 && (cells[amountCol] ?? "").trim() !== "") {
      amount_cents = normalizeAmount(cells[amountCol]);
    } else if (debitCol !== -1 && creditCol !== -1) {
      const debit = normalizeAmount(cells[debitCol] ?? "");
      const credit = normalizeAmount(cells[creditCol] ?? "");
      if (debit !== null && debit !== 0) {
        amount_cents = -Math.abs(debit);
      } else if (credit !== null && credit !== 0) {
        amount_cents = Math.abs(credit);
      }
    }
    if (amount_cents === null || amount_cents === 0) {
      skipped.push(`Row ${i + 1}: no usable amount.`);
      continue;
    }

    let fp = fingerprint(txn_date, amount_cents, description);
    // Identical rows in one file (two same-day coffees) are legitimate;
    // suffix repeats so both import.
    let n = 0;
    while (seen.has(fp)) {
      n += 1;
      fp = `${fingerprint(txn_date, amount_cents, description)}-${n}`;
    }
    seen.add(fp);

    rows.push({ txn_date, description, amount_cents, fingerprint: fp });
  }

  return {
    rows,
    skipped,
    columns: {
      date: headers[dateCol]?.trim() ?? "",
      description: headers[descCol]?.trim() ?? "",
      amount:
        amountCol !== -1
          ? (headers[amountCol]?.trim() ?? "")
          : `${headers[debitCol]?.trim()} / ${headers[creditCol]?.trim()}`,
    },
  };
}

// ---------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------

export type MatchCandidate = {
  entry_id: string;
  entry_number: number;
  entry_date: string; // YYYY-MM-DD
  memo: string | null;
  /** Signed effect of the entry on the bank account (debit - credit). */
  bank_delta_cents: number;
};

/**
 * Finds journal entries that plausibly correspond to a bank row: same
 * signed effect on the bank account, dated within `windowDays`.
 * Closest date wins.
 */
export function findMatches(
  txn: { txn_date: string; amount_cents: number },
  candidates: MatchCandidate[],
  windowDays = 5,
): MatchCandidate[] {
  const txnTime = Date.parse(`${txn.txn_date}T00:00:00Z`);
  return candidates
    .filter((c) => {
      if (c.bank_delta_cents !== txn.amount_cents) return false;
      const diff = Math.abs(Date.parse(`${c.entry_date}T00:00:00Z`) - txnTime);
      return diff <= windowDays * 86_400_000;
    })
    .sort(
      (a, b) =>
        Math.abs(Date.parse(`${a.entry_date}T00:00:00Z`) - txnTime) -
        Math.abs(Date.parse(`${b.entry_date}T00:00:00Z`) - txnTime),
    );
}

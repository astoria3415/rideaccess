/**
 * Expense categorization for AccessRide Books.
 *
 * Two layers: a deterministic keyword engine that always works offline,
 * and an optional Claude refinement (server-side only) that picks from
 * the real chart of accounts. The AI result is validated against the
 * account list, so a bad model answer can never invent a category.
 */

export type CategoryAccount = {
  id: string;
  code: string;
  name: string;
};

/** Keyword rules ordered by specificity; first match wins. */
const RULES: { code: string; keywords: string[] }[] = [
  {
    code: "5000", // Fuel
    keywords: ["fuel", "gas station", "gasoline", "diesel", "bp", "shell", "exxon", "mobil", "sunoco", "citgo", "speedway"],
  },
  {
    code: "5100", // Vehicle Maintenance & Repairs
    keywords: ["repair", "oil change", "tire", "brake", "mechanic", "auto body", "car wash", "inspection", "transmission", "midas", "jiffy lube", "pep boys", "autozone"],
  },
  {
    code: "5200", // Commercial Auto Insurance
    keywords: ["insurance", "geico", "progressive", "allstate", "state farm", "liberty mutual", "premium payment"],
  },
  {
    code: "5300", // Tolls & Parking
    keywords: ["toll", "e-zpass", "ezpass", "ez pass", "parking", "garage", "meter", "mta bridges", "port authority"],
  },
  {
    code: "5400", // Driver Wages
    keywords: ["wage", "salary", "payroll run", "driver pay", "paycheck", "gusto payroll", "adp"],
  },
  {
    code: "5500", // Payroll Taxes
    keywords: ["payroll tax", "941", "futa", "suta", "withholding"],
  },
  {
    code: "5600", // Software & Subscriptions
    keywords: ["software", "subscription", "saas", "vercel", "supabase", "google workspace", "microsoft 365", "adobe", "zoom", "dropbox", "quickbooks", "openai", "anthropic", "twilio", "resend", "domain", "hosting", "app store"],
  },
  {
    code: "5700", // Office Supplies
    keywords: ["office", "staples", "office depot", "paper", "printer", "ink", "toner", "supplies"],
  },
  {
    code: "5800", // Advertising & Marketing
    keywords: ["advertis", "marketing", "google ads", "facebook ads", "meta ads", "yelp", "flyer", "billboard", "promo", "seo"],
  },
  {
    code: "5900", // Professional Services
    keywords: ["attorney", "lawyer", "legal", "accountant", "cpa", "bookkeep", "consultant", "notary"],
  },
  {
    code: "6000", // Bank & Merchant Fees
    keywords: ["stripe fee", "bank fee", "merchant fee", "processing fee", "service charge", "wire fee", "overdraft", "monthly maintenance fee"],
  },
  {
    code: "6200", // Licenses & Permits
    keywords: ["dmv", "license", "permit", "registration", "tlc ", "inspection sticker", "dot "],
  },
];

const DEFAULT_CODE = "6900"; // Miscellaneous Expense

/**
 * Deterministic keyword categorization. Returns the matching account
 * from `accounts`, falling back to Miscellaneous (6900) and finally to
 * the first provided account so the caller always gets a real account.
 */
export function ruleBasedCategory(
  text: string,
  accounts: CategoryAccount[],
): CategoryAccount | null {
  if (accounts.length === 0) return null;
  const haystack = text.toLowerCase();
  const byCode = new Map(accounts.map((a) => [a.code, a]));

  for (const rule of RULES) {
    if (!byCode.has(rule.code)) continue;
    if (rule.keywords.some((k) => haystack.includes(k))) {
      return byCode.get(rule.code)!;
    }
  }
  return byCode.get(DEFAULT_CODE) ?? accounts[0];
}

/**
 * Server-side only: ask Claude to pick the best expense account, then
 * validate the answer against the chart of accounts. Falls back to the
 * keyword engine when no API key is configured or anything goes wrong.
 */
export async function aiCategory(
  description: string,
  vendorName: string | null,
  accounts: CategoryAccount[],
): Promise<CategoryAccount | null> {
  const fallback = ruleBasedCategory(
    `${vendorName ?? ""} ${description}`,
    accounts,
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || accounts.length === 0) return fallback;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 300,
        system:
          "You categorize business expenses for a wheelchair transportation (NEMT) company in NYC. Reply with ONLY the 4-digit account code that best fits the expense — no other text.",
        messages: [
          {
            role: "user",
            content: `Expense: "${description}"${vendorName ? ` from vendor "${vendorName}"` : ""}\n\nAccounts:\n${accounts
              .map((a) => `${a.code} ${a.name}`)
              .join("\n")}\n\nBest account code:`,
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[books] categorize error", res.status, await res.text());
      return fallback;
    }
    const data = await res.json();
    const text: unknown = data?.content?.find(
      (b: { type?: string }) => b?.type === "text",
    )?.text;
    if (typeof text !== "string") return fallback;
    const code = text.match(/\b\d{4}\b/)?.[0];
    const match = accounts.find((a) => a.code === code);
    return match ?? fallback;
  } catch (err) {
    console.error("[books] categorize request failed", err);
    return fallback;
  }
}

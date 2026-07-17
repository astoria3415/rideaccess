/**
 * On-device expense categorization: the deterministic keyword engine
 * from the web app (src/lib/books/categorize.ts). The Claude-powered
 * refinement stays server-side — API keys never ship in an app binary.
 */

export type CategoryAccount = {
  id: string;
  code: string;
  name: string;
};

const RULES: { code: string; keywords: string[] }[] = [
  {
    code: "5000",
    keywords: ["fuel", "gas station", "gasoline", "diesel", "bp", "shell", "exxon", "mobil", "sunoco", "citgo", "speedway"],
  },
  {
    code: "5100",
    keywords: ["repair", "oil change", "tire", "brake", "mechanic", "auto body", "car wash", "inspection", "transmission", "midas", "jiffy lube", "pep boys", "autozone"],
  },
  {
    code: "5200",
    keywords: ["insurance", "geico", "progressive", "allstate", "state farm", "liberty mutual", "premium payment"],
  },
  {
    code: "5300",
    keywords: ["toll", "e-zpass", "ezpass", "ez pass", "parking", "garage", "meter", "mta bridges", "port authority"],
  },
  {
    code: "5400",
    keywords: ["wage", "salary", "payroll run", "driver pay", "paycheck", "gusto payroll", "adp"],
  },
  {
    code: "5500",
    keywords: ["payroll tax", "941", "futa", "suta", "withholding"],
  },
  {
    code: "5600",
    keywords: ["software", "subscription", "saas", "vercel", "supabase", "google workspace", "microsoft 365", "adobe", "zoom", "dropbox", "quickbooks", "openai", "anthropic", "twilio", "resend", "domain", "hosting", "app store"],
  },
  {
    code: "5700",
    keywords: ["office", "staples", "office depot", "paper", "printer", "ink", "toner", "supplies"],
  },
  {
    code: "5800",
    keywords: ["advertis", "marketing", "google ads", "facebook ads", "meta ads", "yelp", "flyer", "billboard", "promo", "seo"],
  },
  {
    code: "5900",
    keywords: ["attorney", "lawyer", "legal", "accountant", "cpa", "bookkeep", "consultant", "notary"],
  },
  {
    code: "6000",
    keywords: ["stripe fee", "bank fee", "merchant fee", "processing fee", "service charge", "wire fee", "overdraft", "monthly maintenance fee"],
  },
  {
    code: "6200",
    keywords: ["dmv", "license", "permit", "registration", "tlc ", "inspection sticker", "dot "],
  },
];

const DEFAULT_CODE = "6900";

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

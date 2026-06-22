import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { site } from "./site";
import type { Invoice, InvoiceLineItem } from "./supabase/types";

// Brand colors (matching tailwind.config.ts)
const PRIMARY = rgb(15 / 255, 76 / 255, 129 / 255); // #0F4C81
const SECONDARY = rgb(0, 151 / 255, 167 / 255); // #0097A7
const INK = rgb(31 / 255, 41 / 255, 55 / 255); // #1F2937
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255); // slate-500
const LINE = rgb(226 / 255, 232 / 255, 240 / 255); // slate-200
const SURFACE = rgb(248 / 255, 250 / 255, 252 / 255); // #F8FAFC

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );

const fmtDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

/** Recompute totals from line items (server-side source of truth). */
export function computeInvoiceTotals(
  lineItems: InvoiceLineItem[],
  taxCents = 0,
) {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + Math.round(li.unit_cents) * Math.max(1, li.quantity),
    0,
  );
  return {
    subtotal_cents: subtotal,
    tax_cents: taxCents,
    total_cents: subtotal + taxCents,
  };
}

/**
 * Render a branded invoice PDF and return the raw bytes. Uses only
 * pdf-lib's built-in fonts so it runs anywhere (no font assets, no
 * headless browser) — safe in a serverless Node runtime.
 */
export async function generateInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${invoice.invoice_number}`);
  doc.setAuthor(site.name);

  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const M = 50; // page margin
  const right = 612 - M;
  let y = 792 - 56;

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: typeof INK } = {},
  ) =>
    page.drawText(s, {
      x,
      y: yy,
      font: opts.font ?? font,
      size: opts.size ?? 10,
      color: opts.color ?? INK,
    });

  const rightText = (
    s: string,
    xRight: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: typeof INK } = {},
  ) => {
    const f = opts.font ?? font;
    const size = opts.size ?? 10;
    text(s, xRight - f.widthOfTextAtSize(s, size), yy, opts);
  };

  // ── Header ─────────────────────────────────────────────
  text("Ride Access", M, y, { font: bold, size: 22, color: PRIMARY });
  text("NYC", M + bold.widthOfTextAtSize("Ride Access", 22) + 6, y, {
    font: bold,
    size: 12,
    color: SECONDARY,
  });
  rightText("INVOICE", right, y, { font: bold, size: 24, color: PRIMARY });

  y -= 18;
  text("Private Wheelchair & Medical Transportation", M, y, {
    size: 9,
    color: MUTED,
  });
  rightText(invoice.invoice_number, right, y, { size: 11, color: INK, font: bold });

  y -= 14;
  text(`${site.phone}  ·  ${site.email}`, M, y, { size: 9, color: MUTED });
  rightText(`Issued ${fmtDate(invoice.issued_date)}`, right, y, {
    size: 9,
    color: MUTED,
  });

  if (invoice.due_date) {
    y -= 12;
    rightText(`Due ${fmtDate(invoice.due_date)}`, right, y, {
      size: 9,
      color: MUTED,
    });
  }

  // divider
  y -= 22;
  page.drawLine({
    start: { x: M, y },
    end: { x: right, y },
    thickness: 1,
    color: LINE,
  });

  // ── Bill To + status ───────────────────────────────────
  y -= 26;
  text("BILL TO", M, y, { font: bold, size: 9, color: SECONDARY });
  rightText("STATUS", right, y, { font: bold, size: 9, color: SECONDARY });
  y -= 16;
  text(invoice.customer_name, M, y, { font: bold, size: 12 });
  rightText(invoice.status.toUpperCase(), right, y, {
    font: bold,
    size: 12,
    color: invoice.status === "paid" ? rgb(16 / 255, 185 / 255, 129 / 255) : PRIMARY,
  });
  if (invoice.customer_email) {
    y -= 14;
    text(invoice.customer_email, M, y, { size: 10, color: MUTED });
  }

  // ── Line items table ───────────────────────────────────
  y -= 34;
  const colQty = right - 200;
  const colUnit = right - 110;
  const rowH = 24;

  // header band
  page.drawRectangle({
    x: M,
    y: y - 6,
    width: right - M,
    height: 22,
    color: SURFACE,
  });
  text("DESCRIPTION", M + 8, y, { font: bold, size: 9, color: MUTED });
  rightText("QTY", colQty + 30, y, { font: bold, size: 9, color: MUTED });
  rightText("UNIT", colUnit + 40, y, { font: bold, size: 9, color: MUTED });
  rightText("AMOUNT", right - 8, y, { font: bold, size: 9, color: MUTED });

  y -= rowH + 2;
  for (const li of invoice.line_items) {
    const qty = Math.max(1, li.quantity);
    const amount = Math.round(li.unit_cents) * qty;
    // wrap description if very long
    const desc =
      li.description.length > 52
        ? li.description.slice(0, 49) + "…"
        : li.description;
    text(desc, M + 8, y, { size: 10 });
    rightText(String(qty), colQty + 30, y, { size: 10, color: MUTED });
    rightText(money(li.unit_cents), colUnit + 40, y, { size: 10, color: MUTED });
    rightText(money(amount), right - 8, y, { size: 10, font: bold });
    y -= rowH;
    page.drawLine({
      start: { x: M, y: y + 8 },
      end: { x: right, y: y + 8 },
      thickness: 0.5,
      color: LINE,
    });
  }

  // ── Totals ─────────────────────────────────────────────
  y -= 12;
  const totalsX = right - 200;
  const totalsRow = (label: string, value: string, strong = false) => {
    text(label, totalsX, y, {
      size: strong ? 12 : 10,
      font: strong ? bold : font,
      color: strong ? INK : MUTED,
    });
    rightText(value, right, y, {
      size: strong ? 12 : 10,
      font: bold,
      color: strong ? PRIMARY : INK,
    });
    y -= strong ? 22 : 18;
  };
  totalsRow("Subtotal", money(invoice.subtotal_cents));
  if (invoice.tax_cents > 0) totalsRow("Tax", money(invoice.tax_cents));
  // separator above total
  page.drawLine({
    start: { x: totalsX, y: y + 8 },
    end: { x: right, y: y + 8 },
    thickness: 1,
    color: LINE,
  });
  y -= 6;
  totalsRow("Total Due", money(invoice.total_cents), true);

  // ── Notes ──────────────────────────────────────────────
  if (invoice.notes) {
    y -= 14;
    text("NOTES", M, y, { font: bold, size: 9, color: SECONDARY });
    y -= 14;
    for (const wrapped of wrapText(invoice.notes, font, 9.5, right - M)) {
      text(wrapped, M, y, { size: 9.5, color: MUTED });
      y -= 13;
    }
  }

  // ── Footer ─────────────────────────────────────────────
  drawFooter(page, font, bold);

  return doc.save();
}

function drawFooter(page: PDFPage, font: PDFFont, bold: PDFFont) {
  const M = 50;
  const right = 612 - M;
  const fy = 70;
  page.drawLine({
    start: { x: M, y: fy + 18 },
    end: { x: right, y: fy + 18 },
    thickness: 1,
    color: LINE,
  });
  page.drawText("Thank you for choosing Ride Access NYC.", {
    x: M,
    y: fy,
    font: bold,
    size: 10,
    color: PRIMARY,
  });
  page.drawText(
    `Questions about this invoice? Call ${site.phone} or email ${site.email}.`,
    { x: M, y: fy - 16, font, size: 8.5, color: MUTED },
  );
  page.drawText(`${site.legalName} · Private-pay transportation provider`, {
    x: M,
    y: fy - 30,
    font,
    size: 8,
    color: MUTED,
  });
}

/** Greedy word-wrap to a pixel width. */
function wrapText(
  textValue: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = textValue.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 6); // cap to keep within footer space
}

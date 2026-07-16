"use client";

import { Download } from "lucide-react";

function escapeCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ExportCsvButton({
  rows,
  filename,
}: {
  rows: (string | number)[][];
  filename: string;
}) {
  function download() {
    const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-surface"
    >
      <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
    </button>
  );
}

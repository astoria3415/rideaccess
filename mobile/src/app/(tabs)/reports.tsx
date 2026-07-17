import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { formatMoney, type AccountType } from "@/lib/books/ledger";
import {
  profitAndLossReport,
  type DatedLine,
  type ProfitAndLossReport,
  type ReportAccount,
} from "@/lib/books/reports";
import { brand } from "@/constants/brand";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presets() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { key: "month", label: "This month", from: iso(new Date(Date.UTC(y, m, 1))), to: iso(now) },
    {
      key: "last",
      label: "Last month",
      from: iso(new Date(Date.UTC(y, m - 1, 1))),
      to: iso(new Date(Date.UTC(y, m, 0))),
    },
    { key: "ytd", label: "Year to date", from: `${y}-01-01`, to: iso(now) },
    { key: "prev", label: "Last year", from: `${y - 1}-01-01`, to: `${y - 1}-12-31` },
  ];
}

export default function ReportsScreen() {
  const periods = presets();
  const [periodKey, setPeriodKey] = useState("ytd");
  const [report, setReport] = useState<ProfitAndLossReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const period = periods.find((p) => p.key === periodKey) ?? periods[2];

  const load = useCallback(async () => {
    const [accountsRes, entriesRes, linesRes] = await Promise.all([
      supabase
        .from("ledger_accounts")
        .select("id, code, name, type, subtype, tax_line"),
      supabase.from("journal_entries").select("id, entry_date"),
      supabase
        .from("journal_lines")
        .select("entry_id, account_id, debit_cents, credit_cents"),
    ]);
    const entryDate = new Map(
      (entriesRes.data ?? []).map((e) => [e.id as string, e.entry_date as string]),
    );
    const accounts: ReportAccount[] = (accountsRes.data ?? []).map((a) => ({
      id: a.id as string,
      code: a.code as string,
      name: a.name as string,
      type: a.type as AccountType,
      subtype: (a.subtype ?? null) as string | null,
      tax_line: (a.tax_line ?? null) as string | null,
    }));
    const lines: DatedLine[] = (linesRes.data ?? []).map((l) => ({
      entry_id: l.entry_id as string,
      account_id: l.account_id as string,
      debit_cents: l.debit_cents as number,
      credit_cents: l.credit_cents as number,
      entry_date: entryDate.get(l.entry_id as string) ?? "1970-01-01",
    }));
    setReport(
      profitAndLossReport(accounts, lines, { from: period.from, to: period.to }),
    );
  }, [period.from, period.to]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: brand.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={brand.primary}
        />
      }
    >
      <View style={styles.chips}>
        {periods.map((p) => (
          <Pressable
            key={p.key}
            accessibilityRole="button"
            accessibilityState={{ selected: p.key === periodKey }}
            onPress={() => setPeriodKey(p.key)}
            style={[styles.chip, p.key === periodKey && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                p.key === periodKey && { color: "#FFFFFF" },
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profit & Loss</Text>
        <Text style={styles.cardSub}>
          {period.from} → {period.to}
        </Text>

        <Text style={styles.section}>Income</Text>
        {report?.income.length === 0 ? (
          <Text style={styles.emptyLine}>No income in this period.</Text>
        ) : null}
        {report?.income.map((r) => (
          <View key={r.account.id} style={styles.line}>
            <Text style={styles.lineLabel}>
              {r.account.code} · {r.account.name}
            </Text>
            <Text style={styles.lineAmount}>{formatMoney(r.amount_cents)}</Text>
          </View>
        ))}
        <View style={[styles.line, styles.totalLine]}>
          <Text style={styles.totalLabel}>Total income</Text>
          <Text style={styles.totalAmount}>
            {formatMoney(report?.total_income_cents ?? 0)}
          </Text>
        </View>

        <Text style={styles.section}>Expenses</Text>
        {report?.expenses.length === 0 ? (
          <Text style={styles.emptyLine}>No expenses in this period.</Text>
        ) : null}
        {report?.expenses.map((r) => (
          <View key={r.account.id} style={styles.line}>
            <Text style={styles.lineLabel}>
              {r.account.code} · {r.account.name}
            </Text>
            <Text style={styles.lineAmount}>{formatMoney(r.amount_cents)}</Text>
          </View>
        ))}
        <View style={[styles.line, styles.totalLine]}>
          <Text style={styles.totalLabel}>Total expenses</Text>
          <Text style={styles.totalAmount}>
            {formatMoney(report?.total_expenses_cents ?? 0)}
          </Text>
        </View>

        <View style={[styles.line, styles.netLine]}>
          <Text style={styles.netLabel}>Net income</Text>
          <Text
            style={[
              styles.netAmount,
              {
                color:
                  (report?.net_income_cents ?? 0) >= 0
                    ? brand.success
                    : brand.danger,
              },
            ]}
          >
            {formatMoney(report?.net_income_cents ?? 0)}
          </Text>
        </View>
      </View>

      <Text style={styles.footnote}>
        Balance sheet, cash flow, Schedule C, and 1099 reports live in the web
        admin at rideaccessnyc.com/admin/books/reports.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.card,
  },
  chipActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: brand.slate500 },
  card: {
    backgroundColor: brand.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 18,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: brand.ink },
  cardSub: { fontSize: 12, color: brand.slate400, marginTop: 2 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: brand.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  emptyLine: { fontSize: 13, color: brand.slate400, paddingVertical: 4 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  lineLabel: { flex: 1, fontSize: 14, color: brand.ink, paddingRight: 8 },
  lineAmount: {
    fontSize: 14,
    color: brand.ink,
    fontVariant: ["tabular-nums"],
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: brand.border,
    marginTop: 4,
    paddingTop: 8,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: brand.ink },
  totalAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: brand.ink,
    fontVariant: ["tabular-nums"],
  },
  netLine: {
    borderTopWidth: 2,
    borderTopColor: brand.border,
    marginTop: 16,
    paddingTop: 10,
  },
  netLabel: { fontSize: 16, fontWeight: "800", color: brand.ink },
  netAmount: {
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  footnote: {
    fontSize: 12,
    color: brand.slate400,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },
});

import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import {
  accountBalance,
  formatMoney,
  profitAndLoss,
  trialBalance,
  type AccountType,
  type LedgerAccountRef,
} from "@/lib/books/ledger";
import { brand } from "@/constants/brand";

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string | null;
};
type LineRow = {
  entry_id: string;
  account_id: string;
  debit_cents: number;
  credit_cents: number;
};

type Kpis = {
  income: number;
  expenses: number;
  net: number;
  cash: number;
  receivable: number;
};

export default function DashboardScreen() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [accountsRes, entriesRes, linesRes] = await Promise.all([
      supabase
        .from("ledger_accounts")
        .select("id, code, name, type, subtype")
        .eq("is_archived", false),
      supabase.from("journal_entries").select("id, entry_date"),
      supabase
        .from("journal_lines")
        .select("entry_id, account_id, debit_cents, credit_cents"),
    ]);
    if (accountsRes.error || entriesRes.error || linesRes.error) {
      setError("Could not load the books. Pull to retry.");
      return;
    }

    const accounts = (accountsRes.data ?? []) as AccountRow[];
    const lines = (linesRes.data ?? []) as LineRow[];
    const entryDate = new Map(
      (entriesRes.data ?? []).map((e) => [e.id as string, e.entry_date as string]),
    );

    const refs: LedgerAccountRef[] = accounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
    }));
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const mtd = profitAndLoss(
      trialBalance(
        refs,
        lines.filter((l) => (entryDate.get(l.entry_id) ?? "") >= monthStart),
      ).rows,
    );

    const balanceFor = (filter: (a: AccountRow) => boolean) => {
      const ids = new Set(accounts.filter(filter).map((a) => a.id));
      let d = 0;
      let c = 0;
      for (const l of lines) {
        if (ids.has(l.account_id)) {
          d += l.debit_cents;
          c += l.credit_cents;
        }
      }
      return accountBalance("asset", d, c);
    };

    setKpis({
      income: mtd.income_cents,
      expenses: mtd.expense_cents,
      net: mtd.net_cents,
      cash: balanceFor(
        (a) => a.type === "asset" && ["cash", "bank"].includes(a.subtype ?? ""),
      ),
      receivable: balanceFor(
        (a) => a.type === "asset" && a.subtype === "receivable",
      ),
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const cards = kpis
    ? ([
        { label: "Income this month", value: kpis.income, icon: "trending-up", color: brand.success },
        { label: "Expenses this month", value: kpis.expenses, icon: "trending-down", color: brand.danger },
        { label: "Net profit this month", value: kpis.net, icon: "scale", color: brand.primary },
        { label: "Cash & bank", value: kpis.cash, icon: "business", color: brand.secondary },
        { label: "Accounts receivable", value: kpis.receivable, icon: "document-text", color: brand.amber },
      ] as const)
    : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.primary} />
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {cards.map((card) => (
        <View key={card.label} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: `${card.color}18` }]}>
            <Ionicons name={`${card.icon}-outline`} size={22} color={card.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{formatMoney(card.value)}</Text>
          </View>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/add-expense")}
        style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.primaryActionText}>Add expense</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => supabase.auth.signOut()}
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="log-out-outline" size={18} color={brand.slate500} />
        <Text style={{ color: brand.slate500, fontWeight: "600" }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.surface },
  error: {
    color: brand.danger,
    backgroundColor: brand.dangerBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: brand.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: { fontSize: 13, color: brand.slate500 },
  cardValue: {
    fontSize: 22,
    fontWeight: "800",
    color: brand.ink,
    fontVariant: ["tabular-nums"],
  },
  primaryAction: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: brand.primary,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  signOut: {
    marginTop: 24,
    minHeight: 44,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});

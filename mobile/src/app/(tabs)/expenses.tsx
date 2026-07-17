import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/books/ledger";
import { brand } from "@/constants/brand";

type ExpenseRow = {
  id: string;
  expense_date: string;
  description: string | null;
  amount_cents: number;
  vendor_id: string | null;
  receipt_url: string | null;
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [vendorNames, setVendorNames] = useState<Map<string, string>>(new Map());
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [expensesRes, vendorsRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("id, expense_date, description, amount_cents, vendor_id, receipt_url")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("vendors").select("id, name"),
    ]);
    setExpenses((expensesRes.data ?? []) as ExpenseRow[]);
    setVendorNames(
      new Map(
        ((vendorsRes.data ?? []) as { id: string; name: string }[]).map((v) => [
          v.id,
          v.name,
        ]),
      ),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = query.trim()
    ? expenses.filter((e) =>
        `${e.description ?? ""} ${e.vendor_id ? (vendorNames.get(e.vendor_id) ?? "") : ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : expenses;

  return (
    <View style={styles.screen}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={brand.slate400} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search expenses…"
          placeholderTextColor={brand.slate400}
          style={styles.searchInput}
          accessibilityLabel="Search expenses"
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {query ? "No matching expenses" : "No expenses yet"}
            </Text>
            <Text style={styles.emptyBody}>
              Tap the + button to record fuel, tolls, repairs — snap the
              receipt as you go.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.description ?? "Expense"}
              </Text>
              <Text style={styles.rowMeta}>
                {item.expense_date}
                {item.vendor_id && vendorNames.get(item.vendor_id)
                  ? ` · ${vendorNames.get(item.vendor_id)}`
                  : ""}
              </Text>
            </View>
            {item.receipt_url ? (
              <Ionicons name="receipt-outline" size={16} color={brand.secondary} />
            ) : null}
            <Text style={styles.rowAmount}>{formatMoney(item.amount_cents)}</Text>
          </View>
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        onPress={() => router.push("/add-expense")}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.surface },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.card,
  },
  searchInput: { flex: 1, fontSize: 15, color: brand.ink, paddingVertical: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: brand.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 14,
    marginBottom: 8,
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: brand.ink },
  rowMeta: { fontSize: 12, color: brand.slate500, marginTop: 2 },
  rowAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: brand.ink,
    fontVariant: ["tabular-nums"],
  },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: brand.ink },
  emptyBody: {
    fontSize: 13,
    color: brand.slate500,
    textAlign: "center",
    marginTop: 6,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

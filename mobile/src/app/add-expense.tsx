import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { parseMoney } from "@/lib/books/ledger";
import { ruleBasedCategory } from "@/lib/books/categorize";
import { brand } from "@/constants/brand";
import { Input, Label, SelectField } from "@/components/ui/Field";

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
};

function base64ToBytes(base64: string): Uint8Array {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let out = 0;
  for (let i = 0; i + 3 < clean.length + 1; i += 4) {
    const chunk =
      (alphabet.indexOf(clean[i]) << 18) |
      (alphabet.indexOf(clean[i + 1]) << 12) |
      ((alphabet.indexOf(clean[i + 2]) & 63) << 6) |
      (alphabet.indexOf(clean[i + 3]) & 63);
    bytes[out++] = (chunk >> 16) & 255;
    if (clean[i + 2] !== undefined) bytes[out++] = (chunk >> 8) & 255;
    if (clean[i + 3] !== undefined) bytes[out++] = chunk & 255;
  }
  return bytes.slice(0, out);
}

export default function AddExpenseScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [expenseDate, setExpenseDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [receipt, setReceipt] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("ledger_accounts")
      .select("id, code, name, type, subtype")
      .eq("is_archived", false)
      .order("code")
      .then(({ data }) => setAccounts((data ?? []) as AccountRow[]));
  }, []);

  const categoryAccounts = useMemo(
    () => accounts.filter((a) => a.type === "expense"),
    [accounts],
  );
  const paymentAccounts = useMemo(
    () =>
      accounts.filter(
        (a) =>
          (a.type === "asset" && ["cash", "bank"].includes(a.subtype ?? "")) ||
          (a.type === "liability" &&
            ["credit_card", "payable"].includes(a.subtype ?? "")),
      ),
    [accounts],
  );

  // Instant on-device suggestion as the description changes.
  useEffect(() => {
    if (!description.trim() || categoryAccounts.length === 0) {
      setSuggestion(null);
      return;
    }
    const match = ruleBasedCategory(description, categoryAccounts);
    if (match && !categoryId) {
      setCategoryId(match.id);
      setSuggestion(`${match.code} · ${match.name}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, categoryAccounts]);

  async function pickReceipt(fromCamera: boolean) {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    };
    const result = fromCamera
      ? await (async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return null;
          return ImagePicker.launchCameraAsync(options);
        })()
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result && !result.canceled && result.assets[0]) {
      setReceipt(result.assets[0]);
    }
  }

  async function save() {
    setError(null);
    const cents = parseMoney(amount);
    if (cents === null || cents <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
      setError("Date must be YYYY-MM-DD.");
      return;
    }
    if (!description.trim() || !categoryId || !paymentId) {
      setError("Description, category, and paid-from account are required.");
      return;
    }
    if (categoryId === paymentId) {
      setError("Category and payment account must differ.");
      return;
    }

    setBusy(true);
    try {
      let receiptPath: string | null = null;
      if (receipt?.base64) {
        receiptPath = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(receiptPath, base64ToBytes(receipt.base64), {
            contentType: "image/jpeg",
          });
        if (uploadError) {
          setError(`Receipt upload failed: ${uploadError.message}`);
          return;
        }
      }

      const { data: expense, error: insertError } = await supabase
        .from("expenses")
        .insert({
          expense_date: expenseDate,
          amount_cents: cents,
          description: description.trim(),
          category_account_id: categoryId,
          payment_account_id: paymentId,
          receipt_url: receiptPath,
        })
        .select("id")
        .single();
      if (insertError || !expense) {
        setError(insertError?.message ?? "Could not save the expense.");
        return;
      }

      const { data: entryId, error: postError } = await supabase.rpc(
        "post_journal_entry",
        {
          p_entry_date: expenseDate,
          p_memo: description.trim(),
          p_lines: [
            {
              account_id: categoryId,
              debit_cents: cents,
              credit_cents: 0,
              description: description.trim(),
            },
            {
              account_id: paymentId,
              debit_cents: 0,
              credit_cents: cents,
              description: description.trim(),
            },
          ],
          p_source_type: "expense",
          p_source_id: expense.id,
        },
      );
      if (postError) {
        // Same invariant as the web app: no expense without its entry.
        await supabase.from("expenses").delete().eq("id", expense.id);
        setError(postError.message);
        return;
      }
      await supabase
        .from("expenses")
        .update({ journal_entry_id: entryId })
        .eq("id", expense.id);

      router.back();
    } finally {
      setBusy(false);
    }
  }

  const toOption = (a: AccountRow) => ({
    id: a.id,
    label: `${a.code} · ${a.name}`,
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: brand.surface }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Label>Date (YYYY-MM-DD)</Label>
      <Input value={expenseDate} onChangeText={setExpenseDate} placeholder={today} />

      <Label>Amount</Label>
      <Input
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
        right
      />

      <Label>Description</Label>
      <Input
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Shell fill-up for van #2"
      />

      <Label>Category</Label>
      <SelectField
        value={categoryId}
        options={categoryAccounts.map(toOption)}
        placeholder="Select category"
        onSelect={(id) => {
          setCategoryId(id);
          setSuggestion(null);
        }}
      />
      {suggestion ? (
        <Text style={styles.suggestion}>Suggested: {suggestion}</Text>
      ) : null}

      <Label>Paid from</Label>
      <SelectField
        value={paymentId}
        options={paymentAccounts.map(toOption)}
        placeholder="Select account"
        onSelect={setPaymentId}
      />

      <Label>Receipt</Label>
      {receipt ? (
        <View style={styles.receiptRow}>
          <Image
            source={{ uri: receipt.uri }}
            style={styles.receiptThumb}
            accessibilityLabel="Receipt photo preview"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove receipt"
            onPress={() => setReceipt(null)}
            hitSlop={12}
          >
            <Ionicons name="close-circle" size={26} color={brand.danger} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.receiptButtons}>
          <Pressable
            accessibilityRole="button"
            onPress={() => pickReceipt(true)}
            style={({ pressed }) => [styles.receiptButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="camera-outline" size={18} color={brand.primary} />
            <Text style={styles.receiptButtonText}>Take photo</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => pickReceipt(false)}
            style={({ pressed }) => [styles.receiptButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="image-outline" size={18} color={brand.primary} />
            <Text style={styles.receiptButtonText}>Choose photo</Text>
          </Pressable>
        </View>
      )}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={save}
        disabled={busy}
        style={({ pressed }) => [
          styles.save,
          busy && { opacity: 0.5 },
          pressed && { opacity: 0.85 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}>Save expense</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  suggestion: { marginTop: 6, fontSize: 12, color: brand.secondary },
  receiptButtons: { flexDirection: "row", gap: 10 },
  receiptButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.card,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptButtonText: { color: brand.primary, fontWeight: "600", fontSize: 14 },
  receiptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  receiptThumb: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
  },
  error: {
    marginTop: 16,
    color: brand.danger,
    backgroundColor: brand.dangerBg,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
  },
  save: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});

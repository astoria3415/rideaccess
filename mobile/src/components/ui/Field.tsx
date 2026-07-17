import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { brand } from "@/constants/brand";

export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  right,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words";
  secureTextEntry?: boolean;
  right?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={brand.slate400}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize ?? "sentences"}
      secureTextEntry={secureTextEntry}
      style={[styles.input, right && { textAlign: "right" }]}
    />
  );
}

export type SelectOption = { id: string; label: string };

/**
 * Touch-friendly select: a field that opens a full-screen sheet of
 * options — no external picker dependency, 48pt touch targets.
 */
export function SelectField({
  value,
  options,
  placeholder,
  onSelect,
}: {
  value: string | null;
  options: SelectOption[];
  placeholder: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected ? `${placeholder}: ${selected.label}` : placeholder}
        onPress={() => setOpen(true)}
        style={styles.input}
      >
        <Text
          style={{ color: selected ? brand.ink : brand.slate400, fontSize: 15 }}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setOpen(false)}
              hitSlop={12}
            >
              <Text style={{ color: brand.secondary, fontSize: 16, fontWeight: "600" }}>
                Close
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  pressed && { backgroundColor: brand.surface },
                  item.id === value && { backgroundColor: "#EFF6FF" },
                ]}
              >
                <Text
                  style={{
                    color: item.id === value ? brand.primary : brand.ink,
                    fontSize: 15,
                    fontWeight: item.id === value ? "600" : "400",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: brand.ink,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: brand.ink,
    backgroundColor: brand.card,
    justifyContent: "center",
  },
  sheet: { flex: 1, backgroundColor: brand.card },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: brand.ink },
  option: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
});

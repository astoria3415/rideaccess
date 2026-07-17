import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { brand } from "@/constants/brand";
import { Input, Label } from "@/components/ui/Field";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (authError) {
      setError("Sign in failed — check your email and password.");
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.card}>
        <View style={styles.logo}>
          <MaterialCommunityIcons name="wheelchair-accessibility" size={30} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>AccessRide Books</Text>
        <Text style={styles.subtitle}>
          Ride Access NYC — accounting on the go
        </Text>

        <Label>Email</Label>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@rideaccessnyc.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Label>Password</Label>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={signIn}
          disabled={busy || !email || !password}
          style={({ pressed }) => [
            styles.button,
            (busy || !email || !password) && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>
        <Text style={styles.footnote}>
          Admin accounts only. Access is logged.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.primary,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: brand.card,
    borderRadius: 20,
    padding: 24,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: brand.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: brand.ink,
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: brand.slate500,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  error: {
    marginTop: 12,
    color: brand.danger,
    backgroundColor: brand.dangerBg,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
  },
  button: {
    marginTop: 20,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  footnote: {
    textAlign: "center",
    color: brand.slate400,
    fontSize: 12,
    marginTop: 14,
  },
});

import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Screen from "../components/Screen";
import { Banner, Button } from "../components/ui";
import { api, ApiError } from "../api";
import { colors, radius } from "../theme";

export default function LoginScreen({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true); setError("");
    try {
      await api.login(email.trim(), password);
      onSuccess();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message && e.message !== "Unauthorized" ? e.message : "Wrong email or password.");
      } else {
        setError((e as Error)?.message || "Something went wrong.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Admin sign in" onBack={onBack}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>Admin sign in</Text>
          <Text style={s.sub}>Only approved admin accounts can view records.</Text>
          <View style={s.panel}>
            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
              keyboardType="email-address" textContentType="username" autoComplete="email" />
            <Text style={[s.label, { marginTop: 16 }]}>Password</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"
              textContentType="password" autoComplete="password" onSubmitEditing={submit} />
          </View>
          {error ? <Banner kind="error" text={error} /> : null}
          <Button title="Sign in" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  panel: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#b9c9c6", borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 16, color: colors.ink, backgroundColor: "#fff" },
});

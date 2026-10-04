import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, fonts, radius } from "../theme";

export function Button({ title, onPress, variant = "solid", disabled, loading, style }: {
  title: string; onPress: () => void; variant?: "solid" | "ghost"; disabled?: boolean; loading?: boolean; style?: ViewStyle;
}) {
  const solid = variant === "solid";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, solid ? s.solid : s.ghost, (disabled || loading) && { opacity: 0.6 }, pressed && { opacity: 0.8 }, style]}
    >
      {loading ? <ActivityIndicator color={solid ? "#fff" : colors.brandDark} /> : <Text style={[s.btnText, { color: solid ? "#fff" : colors.brandDark }]}>{title}</Text>}
    </Pressable>
  );
}

export function Banner({ text, kind }: { text: string; kind: "ok" | "error" }) {
  return (
    <View style={[s.banner, kind === "ok" ? s.bannerOk : s.bannerErr]} accessibilityRole="alert">
      <Text style={{ color: kind === "ok" ? colors.ink : colors.danger, fontWeight: "600", fontFamily: fonts.family }}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return <View style={{ padding: 40 }}><ActivityIndicator size="large" color={colors.brand} /></View>;
}

export function Empty({ text }: { text: string }) {
  return <Text style={{ color: colors.muted, textAlign: "center", padding: 32, fontFamily: fonts.family }}>{text}</Text>;
}

const s = StyleSheet.create({
  btn: { minHeight: 48, paddingHorizontal: 20, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.brand },
  solid: { backgroundColor: colors.brand },
  ghost: { backgroundColor: "#fff" },
  btnText: { fontSize: 16, fontWeight: "700", fontFamily: fonts.family },
  banner: { padding: 12, borderRadius: radius.sm, marginBottom: 16, borderLeftWidth: 5 },
  bannerOk: { backgroundColor: colors.tint, borderLeftColor: colors.brand },
  bannerErr: { backgroundColor: "#fdecea", borderLeftColor: colors.danger },
});
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";

export default function Screen({ title, onBack, right, children }: {
  title: string; onBack?: () => void; right?: { label: string; onPress: () => void }; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.side}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
              <Text style={s.headerAction}>‹ Back</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <View style={[s.side, { alignItems: "flex-end" }]}>
          {right ? (
            <Pressable onPress={right.onPress} hitSlop={10} accessibilityRole="button">
              <Text style={s.headerAction}>{right.label}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: colors.brandDark, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center" },
  side: { width: 80 },
  title: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" },
  headerAction: { color: "#cfe9e5", fontSize: 16, fontWeight: "600" },
});

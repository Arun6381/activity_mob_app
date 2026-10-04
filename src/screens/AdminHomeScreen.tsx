import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import Screen from "../components/Screen";
import { colors, fonts, radius } from "../theme";

const items = [
  { key: "records", title: "Records", sub: "View, search and export entries" },
  { key: "templates", title: "Templates", sub: "Create and edit forms" },
  { key: "archive", title: "Monthly archive", sub: "Back up a month to Excel and free space" },
] as const;

export default function AdminHomeScreen({ onBack, onOpen, onSignOut }: {
  onBack: () => void; onOpen: (key: "records" | "templates" | "archive") => void; onSignOut: () => void;
}) {
  return (
    <Screen title="Admin" onBack={onBack} right={{ label: "Sign out", onPress: onSignOut }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={s.h1}>Admin</Text>
        <Text style={s.sub}>Manage forms and their data.</Text>
        {items.map((i) => (
          <Pressable key={i.key} onPress={() => onOpen(i.key)} accessibilityRole="button"
            style={({ pressed }) => [s.card, pressed && { backgroundColor: colors.tint }]}>
            <Text style={s.cardTitle}>{i.title}</Text>
            <Text style={s.cardSub}>{i.sub}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: colors.ink, fontFamily: fonts.family },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 8, fontFamily: fonts.family },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.ink, fontFamily: fonts.family },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 2, fontFamily: fonts.family },
});

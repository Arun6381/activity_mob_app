import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import Screen from "../components/Screen";
import { Banner, Button, Empty, Loading } from "../components/ui";
import { api } from "../api";
import { colors, radius } from "../theme";
import { FormSummary } from "../types";

export default function HomeScreen({ onOpenForm, onAdmin }: {
  onOpenForm: (slug: string) => void; onAdmin: () => void;
}) {
  const [forms, setForms] = useState<FormSummary[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await api.forms();
      setForms(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load forms.");
      setForms([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen title="Forms" right={{ label: "Admin", onPress: onAdmin }}>
      {forms === null ? <Loading /> : (
        <FlatList
          data={forms}
          keyExtractor={(f) => f.slug}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} colors={[colors.brand]} />}
          ListHeaderComponent={
            <View>
              <Text style={s.h1}>Choose a form</Text>
              <Text style={s.sub}>Pick the form you need to fill in.</Text>
              {error ? <><Banner kind="error" text={error} /><Button title="Try again" variant="ghost" onPress={load} style={{ marginBottom: 12 }} /></> : null}
            </View>
          }
          ListEmptyComponent={error ? null : <Empty text="No forms are available yet." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpenForm(item.slug)} style={({ pressed }) => [s.card, pressed && { backgroundColor: colors.tint }]} accessibilityRole="button">
              <Text style={s.cardTitle}>{item.name}</Text>
              <Text style={s.cardSub}>{item.fieldCount} fields</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});

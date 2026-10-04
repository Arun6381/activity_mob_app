import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import Screen from "../components/Screen";
import { Banner, Button, Empty, Loading } from "../components/ui";
import { api, ApiError } from "../api";
import { colors, fonts, radius } from "../theme";
import { AdminTemplate } from "../types";

export default function TemplatesScreen({ onBack, onOpen, onUnauthorized }: {
  onBack: () => void; onOpen: (id?: string) => void; onUnauthorized: () => void;
}) {
  const [list, setList] = useState<AdminTemplate[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api.templates();
      setList(Array.isArray(res) ? res : []);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setError((e as Error)?.message || "Failed to load templates.");
      setList([]);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen title="Templates" onBack={onBack}>
      {list === null ? <Loading /> : (
        <FlatList
          data={list}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} colors={[colors.brand]} />}
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              <Text style={s.sub}>Create the forms people fill in. Each template has its own fields, records and Excel export.</Text>
              <Button title="+ New template" onPress={() => onOpen(undefined)} />
              {error ? <Banner kind="error" text={error} /> : null}
            </View>
          }
          ListEmptyComponent={error ? null : <Empty text="No templates yet." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpen(item.id)} style={({ pressed }) => [s.card, pressed && { backgroundColor: colors.tint }]} accessibilityRole="button">
              <Text style={s.title}>{item.name}{item.is_active ? "" : "  (inactive)"}</Text>
              <Text style={s.meta}>/f/{item.slug} · {item.fields.length} fields</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  sub: { color: colors.muted, fontFamily: fonts.family },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16 },
  title: { fontSize: 17, fontWeight: "700", color: colors.ink, fontFamily: fonts.family },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2, fontFamily: fonts.family },
});

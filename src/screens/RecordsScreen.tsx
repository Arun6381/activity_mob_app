import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Screen from "../components/Screen";
import { Banner, Button, Empty, Loading } from "../components/ui";
import { api, ApiError, exportToExcel } from "../api";
import { colors, radius } from "../theme";
import { AdminTemplate, Submission } from "../types";

export default function RecordsScreen({ onBack, onUnauthorized }: {
  onBack: () => void; onUnauthorized: () => void;
}) {
  const [templates, setTemplates] = useState<AdminTemplate[] | null>(null);
  const [tid, setTid] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const t = templates?.find((x) => x.id === tid);

  const fail = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) return onUnauthorized();
    setError((e as Error).message);
  }, [onUnauthorized]);

  useEffect(() => {
    api.templates()
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setTemplates(arr);
        if (arr[0]) setTid(arr[0].id);
        else setRows([]);
      })
      .catch((e) => {
        fail(e);
        setTemplates([]);
        setRows([]);
      });
  }, [fail]);

  const loadRows = useCallback(async () => {
    if (!tid) return;
    try {
      setError("");
      const res = await api.submissions(tid, q);
      setRows(Array.isArray(res) ? res : []);
    } catch (e) {
      fail(e);
      setRows([]);
    }
  }, [tid, q, fail]);

  useEffect(() => {
    if (!tid) return;
    setRows(null);
    const timer = setTimeout(loadRows, 300); // wait while typing
    return () => clearTimeout(timer);
  }, [tid, q, loadRows]);

  const doExport = async () => {
    if (!t) return;
    setExporting(true); setError("");
    try { await exportToExcel(t.id, t.slug, q); } catch (e) { fail(e); } finally { setExporting(false); }
  };

  return (
    <Screen title="Records" onBack={onBack}>
      {templates === null ? <Loading /> : (
        <FlatList
          data={rows ?? []}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadRows(); setRefreshing(false); }} tintColor={colors.brand} colors={[colors.brand]} />}
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              {templates.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
                  {templates.map((x) => (
                    <Pressable key={x.id} onPress={() => setTid(x.id)} style={[s.chip, x.id === tid && s.chipOn]}>
                      <Text style={{ color: x.id === tid ? "#fff" : colors.brandDark, fontWeight: "600" }}>{x.name}{x.is_active ? "" : " (inactive)"}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              <TextInput style={s.search} placeholder="Search entries" placeholderTextColor={colors.muted} value={q} onChangeText={setQ}
                autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
              <Button title="Export to Excel" onPress={doExport} loading={exporting} disabled={!t} />
              {error ? <Banner kind="error" text={error} /> : null}
              <Text style={{ color: colors.muted }}>{rows === null ? "Loading..." : `${rows.length} ${rows.length === 1 ? "entry" : "entries"}`}</Text>
            </View>
          }
          ListEmptyComponent={rows === null ? <Loading /> : <Empty text={t ? "No entries found." : "No forms yet."} />}
          renderItem={({ item }) => (
            <View style={s.card}>
              {t?.fields.map((f) => (
                <View key={f.key} style={s.line}>
                  <Text style={s.lineLabel}>{f.label}</Text>
                  <Text style={s.lineValue}>{item.data?.[f.key] || "-"}</Text>
                </View>
              ))}
              <Text style={s.created}>Created {new Date(item.created_at).toLocaleString("en-IN")}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.brand, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: colors.brand },
  search: { minHeight: 48, borderWidth: 1, borderColor: "#b9c9c6", borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 16, color: colors.ink, backgroundColor: "#fff" },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 5 },
  lineLabel: { color: colors.muted, flexShrink: 0, maxWidth: "45%" },
  lineValue: { color: colors.ink, fontWeight: "600", flex: 1, textAlign: "right" },
  created: { color: colors.muted, fontSize: 12, marginTop: 8 },
});

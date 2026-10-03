import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Screen from "../components/Screen";
import { Banner, Button, Empty, Loading } from "../components/ui";
import { api, ApiError, downloadBackup } from "../api";
import { colors, radius } from "../theme";
import { AdminTemplate, Backup } from "../types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ist = () => new Date(Date.now() + 5.5 * 3600e3); // current time in India
const idx = (y: number, m: number) => y * 12 + (m - 1);

export default function ArchiveScreen({ onBack, onUnauthorized }: { onBack: () => void; onUnauthorized: () => void }) {
  const now = ist();
  const current = idx(now.getUTCFullYear(), now.getUTCMonth() + 1);
  const [templates, setTemplates] = useState<AdminTemplate[] | null>(null);
  const [tid, setTid] = useState("");
  const [monthIdx, setMonthIdx] = useState(current - 1); // default: last month
  const [backups, setBackups] = useState<Backup[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const year = Math.floor(monthIdx / 12), month = (monthIdx % 12) + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const tpl = templates?.find((t) => t.id === tid);

  const fail = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) return onUnauthorized();
    setMsg({ ok: false, text: (e as Error).message });
  }, [onUnauthorized]);

  const loadBackups = useCallback(async () => {
    try { setBackups(await api.backups()); } catch (e) { fail(e); setBackups((b) => b ?? []); }
  }, [fail]);

  useEffect(() => {
    api.templates().then((d) => { setTemplates(d); if (d[0]) setTid(d[0].id); }).catch((e) => { fail(e); setTemplates([]); });
    loadBackups();
  }, [fail, loadBackups]);

  const archive = () => {
    if (!tpl) return;
    Alert.alert(
      "Archive month",
      `Back up ${MONTHS[month - 1]} ${year} for "${tpl.name}" to Excel, then DELETE those entries from the database?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: async () => {
          setBusy(true); setMsg(null);
          try {
            const r = await api.archiveMonth(tid, monthKey);
            setMsg({ ok: true, text: `Archived ${r.rowCount} entries for ${monthKey} and removed them from the database.` });
          } catch (e) { fail(e); }
          setBusy(false);
          loadBackups();
        } },
      ],
    );
  };

  const download = async (b: Backup) => {
    setDownloading(b.id); setMsg(null);
    try { await downloadBackup(b.id); } catch (e) { fail(e); } finally { setDownloading(""); }
  };

  return (
    <Screen title="Monthly archive" onBack={onBack}>
      {templates === null ? <Loading /> : (
        <FlatList
          data={backups ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadBackups(); setRefreshing(false); }} tintColor={colors.brand} colors={[colors.brand]} />}
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              <Text style={s.sub}>Back up a finished month to Excel, then remove those entries to free database space. Archived entries can be downloaded but no longer appear in Records.</Text>
              <View style={s.panel}>
                {templates.length > 1 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
                    {templates.map((t) => (
                      <Pressable key={t.id} onPress={() => setTid(t.id)} style={[s.chip, t.id === tid && s.chipOn]}>
                        <Text style={{ color: t.id === tid ? "#fff" : colors.brandDark, fontWeight: "600" }}>{t.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : tpl ? <Text style={s.tplName}>{tpl.name}</Text> : null}
                <View style={s.stepper}>
                  <Pressable onPress={() => setMonthIdx((m) => m - 1)} style={s.step} accessibilityLabel="Previous month"><Text style={s.stepText}>‹</Text></Pressable>
                  <Text style={s.monthText}>{MONTHS[month - 1]} {year}</Text>
                  <Pressable onPress={() => setMonthIdx((m) => Math.min(m + 1, current - 1))} disabled={monthIdx >= current - 1}
                    style={[s.step, monthIdx >= current - 1 && { opacity: 0.35 }]} accessibilityLabel="Next month"><Text style={s.stepText}>›</Text></Pressable>
                </View>
                <Button title="Archive month" onPress={archive} loading={busy} disabled={!tpl} style={{ marginTop: 12 }} />
                {msg ? <View style={{ marginTop: 12 }}><Banner kind={msg.ok ? "ok" : "error"} text={msg.text} /></View> : null}
              </View>
              <Text style={s.section}>Archived months</Text>
            </View>
          }
          ListEmptyComponent={backups === null ? <Loading /> : <Empty text="No archived months yet." />}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.form_templates?.name ?? "-"} · {item.month}</Text>
                <Text style={s.cardSub}>{item.row_count} entries · archived {new Date(item.created_at).toLocaleDateString("en-IN")}</Text>
              </View>
              <Button title="Download" variant="ghost" onPress={() => download(item)} loading={downloading === item.id} style={{ minWidth: 110 }} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  sub: { color: colors.muted },
  panel: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16 },
  tplName: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 12 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.brand, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: colors.brand },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  step: { width: 52, height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.brand, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  stepText: { fontSize: 24, color: colors.brandDark, fontWeight: "700" },
  monthText: { fontSize: 18, fontWeight: "800", color: colors.ink },
  section: { fontSize: 16, fontWeight: "800", color: colors.brandDark, marginTop: 4 },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});

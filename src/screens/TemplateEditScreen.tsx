import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import Screen from "../components/Screen";
import { Banner, Button, Loading } from "../components/ui";
import { api, ApiError } from "../api";
import { colors, radius } from "../theme";
import { FIELD_TYPES, FieldDef, FieldType } from "../types";

type DraftField = { key: string; label: string; type: FieldType; required: boolean; opts: string; isNew: boolean };
type Draft = { id?: string; name: string; slug: string; is_active: boolean; fields: DraftField[] };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const keyify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").replace(/^(\d)/, "f_$1");
const blankField = (required: boolean): DraftField => ({ key: "", label: "", type: "text", required, opts: "", isNew: true });

export default function TemplateEditScreen({ id, onBack, onSaved, onUnauthorized }: {
  id?: string; onBack: () => void; onSaved: () => void; onUnauthorized: () => void;
}) {
  const [d, setD] = useState<Draft | null>(id ? null : { name: "", slug: "", is_active: true, fields: [blankField(true)] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.templates().then((list) => {
      const t = list.find((x) => x.id === id);
      if (!t) return setError("Template not found.");
      setD({ id: t.id, name: t.name, slug: t.slug, is_active: t.is_active,
        fields: t.fields.map((f) => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, opts: f.options?.join(", ") ?? "", isNew: false })) });
    }).catch((e) => { if (e instanceof ApiError && e.status === 401) onUnauthorized(); else setError((e as Error).message); });
  }, [id, onUnauthorized]);

  const setField = (i: number, patch: Partial<DraftField>) =>
    setD((x) => x && { ...x, fields: x.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  const move = (i: number, by: number) => setD((x) => {
    if (!x || i + by < 0 || i + by >= x.fields.length) return x;
    const fields = [...x.fields]; [fields[i], fields[i + by]] = [fields[i + by], fields[i]];
    return { ...x, fields };
  });

  const save = async () => {
    if (!d) return;
    setBusy(true); setError("");
    const fields: FieldDef[] = d.fields.map((f) => ({
      key: f.key, label: f.label.trim(), type: f.type, required: f.required,
      options: f.type === "select" ? f.opts.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    }));
    try {
      await api.saveTemplate(d.id, { name: d.name, slug: d.slug, is_active: d.is_active, fields });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={id ? "Edit template" : "New template"} onBack={onBack}>
      {!d ? (error ? <View style={{ padding: 16 }}><Banner kind="error" text={error} /></View> : <Loading />) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <View style={s.panel}>
              <Text style={s.label}>Template name</Text>
              <TextInput style={s.input} value={d.name}
                onChangeText={(v) => setD({ ...d, name: v, slug: d.id ? d.slug : slugify(v) })} />
              <Text style={[s.label, { marginTop: 14 }]}>URL name (/f/...)</Text>
              <TextInput style={[s.input, d.id ? s.disabled : null]} value={d.slug} editable={!d.id} autoCapitalize="none" autoCorrect={false}
                onChangeText={(v) => setD({ ...d, slug: slugify(v) })} />
              <View style={s.switchRow}>
                <Text style={s.switchText}>Active (people can fill it in)</Text>
                <Switch value={d.is_active} onValueChange={(v) => setD({ ...d, is_active: v })} trackColor={{ true: colors.brand, false: colors.line }} />
              </View>
            </View>

            <Text style={s.section}>Fields</Text>
            {d.fields.map((f, i) => (
              <View key={i} style={s.panel}>
                <Text style={s.label}>Label</Text>
                <TextInput style={s.input} value={f.label}
                  onChangeText={(v) => setField(i, { label: v, ...(f.isNew ? { key: keyify(v) } : {}) })} />
                <Text style={s.hint}>{f.key ? `Key: ${f.key}${f.isNew ? "" : " (locked)"}` : "Key is created from the label"}</Text>

                <Text style={[s.label, { marginTop: 12 }]}>Type</Text>
                <View style={s.chips}>
                  {FIELD_TYPES.map((t) => (
                    <Pressable key={t} onPress={() => setField(i, { type: t })} style={[s.chip, f.type === t && s.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: f.type === t }}>
                      <Text style={{ color: f.type === t ? "#fff" : colors.brandDark, fontWeight: "600" }}>{t}</Text>
                    </Pressable>
                  ))}
                </View>

                {f.type === "select" ? (
                  <>
                    <Text style={[s.label, { marginTop: 12 }]}>Options (separate with commas)</Text>
                    <TextInput style={s.input} value={f.opts} onChangeText={(v) => setField(i, { opts: v })} placeholder="Done, Not done" placeholderTextColor={colors.muted} />
                  </>
                ) : null}

                <View style={s.switchRow}>
                  <Text style={s.switchText}>Required</Text>
                  <Switch value={f.required} onValueChange={(v) => setField(i, { required: v })} trackColor={{ true: colors.brand, false: colors.line }} />
                </View>

                <View style={s.actions}>
                  <Button title="↑" variant="ghost" onPress={() => move(i, -1)} style={s.small} />
                  <Button title="↓" variant="ghost" onPress={() => move(i, 1)} style={s.small} />
                  <Button title="Remove" variant="ghost" onPress={() => setD({ ...d, fields: d.fields.filter((_, j) => j !== i) })} style={{ flex: 1 }} />
                </View>
              </View>
            ))}
            <Button title="+ Add field" variant="ghost" onPress={() => setD({ ...d, fields: [...d.fields, blankField(false)] })} style={{ marginBottom: 16 }} />

            {error ? <Banner kind="error" text={error} /> : null}
            <Button title="Save template" onPress={save} loading={busy} />
            <Text style={s.note}>Removing a field hides it from the form, records and export. Old answers stay in the database.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16, marginBottom: 14 },
  section: { fontSize: 16, fontWeight: "800", color: colors.brandDark, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#b9c9c6", borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 16, color: colors.ink, backgroundColor: "#fff" },
  disabled: { backgroundColor: "#f0f3f2", color: colors.muted },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.brand, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: colors.brand },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, minHeight: 44 },
  switchText: { fontSize: 15, color: colors.ink, fontWeight: "600", flex: 1, paddingRight: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  small: { width: 56, paddingHorizontal: 0 },
  note: { color: colors.muted, fontSize: 12, marginTop: 12 },
});

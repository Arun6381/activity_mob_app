import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Screen from "../components/Screen";
import FieldInput from "../components/FieldInput";
import { Banner, Button, Loading } from "../components/ui";
import { api } from "../api";
import { validate } from "../validate";
import { colors, radius } from "../theme";
import { FormDef } from "../types";

export default function FormScreen({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [form, setForm] = useState<FormDef | null>(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"form" | "preview">("form");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    setLoadError("");
    api.form(slug)
      .then((data) => {
        if (data && Array.isArray(data.fields)) {
          setForm(data);
        } else {
          setLoadError("Invalid form data received from server.");
        }
      })
      .catch((e) => setLoadError((e as Error)?.message || "Failed to load form."));
  }, [slug]);

  const toTop = () => scroll.current?.scrollTo({ y: 0, animated: false });

  const preview = () => {
    if (!form || !Array.isArray(form.fields)) return;
    const errs = validate(form.fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setMessage(""); setStep("preview"); toTop();
  };

  const save = async () => {
    if (!form || !Array.isArray(form.fields)) return;
    setSaving(true); setSaveError("");
    try {
      const answers: Record<string, string> = {};
      form.fields.forEach((f) => { answers[f.key] = (values[f.key] ?? "").trim(); });
      await api.submit(slug, answers);
      setValues({}); setErrors({}); setStep("form"); setMessage("Your entry was saved."); toTop();
    } catch (e) {
      setSaveError((e as Error)?.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={form?.name ?? "Form"} onBack={step === "preview" ? () => setStep("form") : onBack}>
      {loadError ? <View style={{ padding: 16 }}><Banner kind="error" text={loadError} /></View> : !form || !Array.isArray(form.fields) ? <Loading /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView ref={scroll} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {step === "preview" ? (
              <>
                <Text style={s.h1}>Check the details</Text>
                <Text style={s.sub}>Confirm everything is correct before saving.</Text>
                <View style={s.panel}>
                  {form.fields.map((f) => (
                    <View key={f.key} style={s.row}>
                      <Text style={s.rowLabel}>{f.label}</Text>
                      <Text style={s.rowValue}>{(values[f.key] ?? "").trim() || "-"}</Text>
                    </View>
                  ))}
                </View>
                {saveError ? <Banner kind="error" text={saveError} /> : null}
                <Button title="Save entry" onPress={save} loading={saving} />
                <Button title="Edit details" variant="ghost" onPress={() => setStep("form")} disabled={saving} style={{ marginTop: 12 }} />
              </>
            ) : (
              <>
                <Text style={s.h1}>{form.name}</Text>
                <Text style={s.sub}>Fill in the details, then preview them before saving.</Text>
                {message ? <Banner kind="ok" text={message} /> : null}
                <View style={s.panel}>
                  {form.fields.map((f) => (
                    <FieldInput key={f.key} field={f} value={values[f.key] ?? ""} error={errors[f.key]}
                      onChange={(v) => { setValues((x) => ({ ...x, [f.key]: v })); if (errors[f.key]) setErrors((e) => { const { [f.key]: _, ...rest } = e; return rest; }); }} />
                  ))}
                </View>
                <Button title="Preview entry" onPress={preview} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  panel: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16, marginBottom: 16 },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.ink, fontSize: 16, fontWeight: "600", marginTop: 2 },
});

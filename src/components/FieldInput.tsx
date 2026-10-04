import React from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { colors, fonts, radius } from "../theme";
import { FieldDef } from "../types";

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date());

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (Platform.OS === "ios") {
    return value ? (
      <View style={{ alignItems: "flex-start" }}>
        <DateTimePicker value={fromIso(value)} mode="date" display="compact" onValueChange={(_, d) => d && onChange(toIso(d))} />
      </View>
    ) : (
      <Pressable style={s.input} onPress={() => onChange(toIso(new Date()))}><Text style={s.placeholder}>Select date</Text></Pressable>
    );
  }
  return (
    <Pressable
      style={s.input}
      onPress={() => DateTimePickerAndroid.open({ value: fromIso(value), mode: "date", onValueChange: (_, d) => d && onChange(toIso(d)) })}
    >
      <Text style={value ? s.text : s.placeholder}>{value || "Select date"}</Text>
    </Pressable>
  );
}

export default function FieldInput({ field, value, onChange, error }: {
  field: FieldDef; value: string; onChange: (v: string) => void; error?: string;
}) {
  let control: React.ReactNode;
  if (field.type === "date") {
    control = <DateField value={value} onChange={onChange} />;
  } else if (field.type === "select") {
    control = (
      <View style={s.chips}>
        {(field.options ?? []).map((o) => {
          const on = value === o;
          return (
            <Pressable key={o} onPress={() => onChange(on ? "" : o)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={[s.chip, on && s.chipOn]}>
              <Text style={{ color: on ? "#fff" : colors.brandDark, fontWeight: "600", fontFamily: fonts.family }}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  } else {
    control = (
      <TextInput
        style={[s.input, s.text, field.type === "textarea" && { minHeight: 90, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChange}
        multiline={field.type === "textarea"}
        keyboardType={field.type === "email" ? "email-address" : field.type === "phone" ? "phone-pad" : field.type === "number" ? "decimal-pad" : "default"}
        autoCapitalize={field.type === "email" ? "none" : "sentences"}
        autoCorrect={field.type === "text" || field.type === "textarea"}
        placeholderTextColor={colors.muted}
      />
    );
  }
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={s.label}>{field.label}{field.required ? "" : " (optional)"}</Text>
      {control}
      {error ? <Text style={s.err} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6, fontFamily: fonts.family },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#b9c9c6", borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", justifyContent: "center", fontFamily: fonts.family },
  text: { fontSize: 16, color: colors.ink, fontFamily: fonts.family },
  placeholder: { fontSize: 16, color: colors.muted, fontFamily: fonts.family },
  err: { color: colors.danger, fontSize: 13, marginTop: 4, fontFamily: fonts.family },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.brand, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: colors.brand },
});

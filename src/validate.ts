import { FieldDef } from "./types";

// Same rules as the website. The server checks every submission again.
export function validate(fields: FieldDef[], values: Record<string, string>) {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = (values[f.key] ?? "").trim();
    if (!v) {
      if (f.required) errors[f.key] = "This field is required";
      continue;
    }
    if (f.type === "number" && !/^-?\d+(\.\d+)?$/.test(v)) errors[f.key] = "Enter a number";
    else if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[f.key] = "Enter a valid email";
    else if (f.type === "phone" && !/^[0-9+\-\s]{7,15}$/.test(v)) errors[f.key] = "Enter a valid phone number";
    else if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errors[f.key] = "Select a date";
    else if (f.type === "select" && !f.options?.includes(v)) errors[f.key] = "Choose one of the options";
  }
  return errors;
}

export type FieldType = "text" | "textarea" | "number" | "date" | "email" | "phone" | "select";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

export type FormSummary = { name: string; slug: string; fieldCount: number };
export type FormDef = { name: string; slug: string; fields: FieldDef[] };
export type AdminTemplate = FormDef & { id: string; is_active: boolean };
export type Submission = { id: string; data: Record<string, string>; created_at: string };

export type Backup = {
  id: string;
  template_id: string;
  month: string;
  row_count: number;
  file_path: string;
  created_at: string;
  form_templates?: { name: string } | null;
};

export type TemplateBody = { name: string; slug: string; is_active: boolean; fields: FieldDef[] };

export const FIELD_TYPES: FieldType[] = ["text", "textarea", "number", "date", "email", "phone", "select"];

export type Route =
  | { name: "home" }
  | { name: "form"; slug: string }
  | { name: "login" }
  | { name: "admin" }
  | { name: "records" }
  | { name: "templates" }
  | { name: "templateEdit"; id?: string }
  | { name: "archive" };

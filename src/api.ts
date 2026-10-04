// import * as SecureStore from "expo-secure-store";
// import { File, Paths } from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import { API_URL, VERCEL_BYPASS_TOKEN } from "./config";
// import { AdminTemplate, Backup, FormDef, FormSummary, Submission, TemplateBody } from "./types";

// const TOKEN_KEY = "admin_token";
// let cached: string | null | undefined;

// export async function getToken() {
//   if (cached === undefined) cached = await SecureStore.getItemAsync(TOKEN_KEY);
//   return cached;
// }

// export async function setToken(token: string | null) {
//   cached = token;
//   if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
//   else await SecureStore.deleteItemAsync(TOKEN_KEY);
// }

// export class ApiError extends Error {
//   status: number;
//   constructor(message: unknown, status: number) {
//     const text =
//       typeof message === "string"
//         ? message
//         : message && typeof message === "object" && "message" in message && typeof (message as any).message === "string"
//         ? (message as any).message
//         : JSON.stringify(message) || "An error occurred.";
//     super(text);
//     this.status = status;
//   }
// }

// async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
//   const headers: Record<string, string> = { Accept: "application/json" };
//   if (init.body !== undefined) headers["Content-Type"] = "application/json";
//   if (init.auth) {
//     const token = await getToken();
//     if (token) headers.Authorization = `Bearer ${token}`;
//   }
//   if (VERCEL_BYPASS_TOKEN) {
//     headers["x-vercel-protection-bypass"] = VERCEL_BYPASS_TOKEN;
//   }

//   const controller = new AbortController();
//   const timer = setTimeout(() => controller.abort(), 20000);
//   let res: Response;
//   const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
//   try {
//     res = await fetch(url, {
//       method: init.method ?? "GET",
//       headers,
//       body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
//       signal: controller.signal,
//     });
//   } catch {
//     throw new ApiError("Could not reach the server. Check your internet connection.", 0);
//   } finally {
//     clearTimeout(timer);
//   }

//   const contentType = res.headers.get("content-type") || "";
//   const isJson = contentType.includes("application/json");

//   if (!isJson) {
//     const rawText = await res.text().catch(() => "");
//     if (
//       res.url.includes("vercel.com/login") ||
//       res.url.includes("vercel.com/sso-api") ||
//       rawText.includes("Protected by Vercel Authentication")
//     ) {
//       throw new ApiError(
//         "Backend is protected by Vercel Authentication. Please disable Deployment Protection in Vercel settings or deploy to production.",
//         401
//       );
//     }
//     if (!res.ok) {
//       throw new ApiError(`Server error (${res.status}).`, res.status);
//     }
//     throw new ApiError("Invalid response from server (expected JSON, received HTML).", res.status);
//   }

//   const json = await res.json().catch(() => null);

//   if (!res.ok) {
//     let msg = "Something went wrong. Try again.";
//     if (json) {
//       if (typeof json.error === "string" && json.error.trim()) {
//         msg = json.error;
//       } else if (typeof json.error?.message === "string" && json.error.message.trim()) {
//         if (json.error.message === "Protected deployment" || json.message?.includes("Vercel Authentication")) {
//           msg = "Backend is protected by Vercel Authentication. Please disable Deployment Protection in Vercel settings or deploy to production.";
//         } else {
//           msg = json.error.message;
//         }
//       } else if (typeof json.message === "string" && json.message.trim()) {
//         if (json.message.includes("Vercel Authentication")) {
//           msg = "Backend is protected by Vercel Authentication. Please disable Deployment Protection in Vercel settings or deploy to production.";
//         } else {
//           msg = json.message;
//         }
//       }
//     }
//     throw new ApiError(msg, res.status);
//   }

//   return json as T;
// }

// export const api = {
//   forms: () => request<FormSummary[]>("/api/forms"),
//   form: (slug: string) => request<FormDef>(`/api/forms/${encodeURIComponent(slug)}`),
//   submit: (slug: string, answers: Record<string, string>) =>
//     request<{ ok: true }>(`/api/submit/${encodeURIComponent(slug)}`, { method: "POST", body: answers }),
//   login: async (email: string, password: string) => {
//     const r = await request<{ token: string }>("/api/login", { method: "POST", body: { email, password } });
//     await setToken(r.token);
//   },
//   templates: () => request<AdminTemplate[]>("/api/admin/templates", { auth: true }),
//   saveTemplate: (id: string | undefined, body: TemplateBody) =>
//     request<AdminTemplate>(id ? `/api/admin/templates/${encodeURIComponent(id)}` : "/api/admin/templates", { method: id ? "PUT" : "POST", body, auth: true }),
//   backups: () => request<Backup[]>("/api/admin/archive", { auth: true }),
//   archiveMonth: (template: string, month: string) =>
//     request<{ rowCount: number; path: string }>("/api/admin/archive", { method: "POST", body: { template, month }, auth: true }),
//   backupLink: (id: string) =>
//     request<{ url: string; filename: string }>(`/api/admin/archive?id=${encodeURIComponent(id)}&format=json`, { auth: true }),
//   submissions: (templateId: string, q: string) =>
//     request<Submission[]>(`/api/admin/submissions?template=${encodeURIComponent(templateId)}&q=${encodeURIComponent(q)}`, { auth: true }),
// };

// const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// async function saveAndShare(bytes: ArrayBuffer, filename: string) {
//   const file = new File(Paths.cache, filename);
//   if (file.exists) file.delete();
//   file.create();
//   file.write(new Uint8Array(bytes));
//   if (!(await Sharing.isAvailableAsync())) throw new ApiError("Sharing is not available on this device.", 0);
//   await Sharing.shareAsync(file.uri, { mimeType: XLSX, UTI: "org.openxmlformats.spreadsheetml.sheet", dialogTitle: "Save or share the Excel file" });
// }

// // Downloads an archived month (the link is a short-lived signed address, so no login header is sent to it)
// export async function downloadBackup(backupId: string) {
//   const { url, filename } = await api.backupLink(backupId);
//   const res = await fetch(url).catch(() => null);
//   if (!res) throw new ApiError("Could not reach the server. Check your internet connection.", 0);
//   if (!res.ok) throw new ApiError("Could not download the file.", res.status);
//   await saveAndShare(await res.arrayBuffer(), filename);
// }

// // Downloads the Excel export and opens the share sheet (save to Files / Drive, or open in Excel)
// export async function exportToExcel(templateId: string, slug: string, q: string) {
//   const token = await getToken();
//   const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
//   if (VERCEL_BYPASS_TOKEN) headers["x-vercel-protection-bypass"] = VERCEL_BYPASS_TOKEN;
//   const res = await fetch(`${API_URL}/api/export?template=${encodeURIComponent(templateId)}&q=${encodeURIComponent(q)}`, {
//     headers,
//   }).catch(() => null);
//   if (!res) throw new ApiError("Could not reach the server. Check your internet connection.", 0);
//   if (!res.ok) throw new ApiError(res.status === 401 ? "Please sign in again." : "Could not create the Excel file.", res.status);

//   await saveAndShare(await res.arrayBuffer(), `${slug}-${new Date().toISOString().slice(0, 10)}.xlsx`);
// }

import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_URL } from "./config";
import { AdminTemplate, Backup, FormDef, FormSummary, Submission, TemplateBody } from "./types";

const TOKEN_KEY = "admin_token";
let cached: string | null | undefined;

export async function getToken() {
  if (cached === undefined) cached = await SecureStore.getItemAsync(TOKEN_KEY);
  return cached;
}

export async function setToken(token: string | null) {
  cached = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your internet connection.", 0);
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.error || "Something went wrong. Try again.", res.status);
  return json as T;
}

export const api = {
  forms: () => request<FormSummary[]>("/api/forms"),
  form: (slug: string) => request<FormDef>(`/api/forms/${encodeURIComponent(slug)}`),
  submit: (slug: string, answers: Record<string, string>) =>
    request<{ ok: true }>(`/api/submit/${encodeURIComponent(slug)}`, { method: "POST", body: answers }),
  login: async (email: string, password: string) => {
    const r = await request<{ token: string }>("/api/login", { method: "POST", body: { email, password } });
    await setToken(r.token);
  },
  templates: () => request<AdminTemplate[]>("/api/admin/templates", { auth: true }),
  saveTemplate: (id: string | undefined, body: TemplateBody) =>
    request<AdminTemplate>(id ? `/api/admin/templates/${encodeURIComponent(id)}` : "/api/admin/templates", { method: id ? "PUT" : "POST", body, auth: true }),
  backups: () => request<Backup[]>("/api/admin/archive", { auth: true }),
  archiveMonth: (template: string, month: string) =>
    request<{ rowCount: number; path: string }>("/api/admin/archive", { method: "POST", body: { template, month }, auth: true }),
  backupLink: (id: string) =>
    request<{ url: string; filename: string }>(`/api/admin/archive?id=${encodeURIComponent(id)}&format=json`, { auth: true }),
  submissions: (templateId: string, q: string) =>
    request<Submission[]>(`/api/admin/submissions?template=${encodeURIComponent(templateId)}&q=${encodeURIComponent(q)}`, { auth: true }),
};

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function saveAndShare(bytes: ArrayBuffer, filename: string) {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(new Uint8Array(bytes));
  if (!(await Sharing.isAvailableAsync())) throw new ApiError("Sharing is not available on this device.", 0);
  await Sharing.shareAsync(file.uri, { mimeType: XLSX, UTI: "org.openxmlformats.spreadsheetml.sheet", dialogTitle: "Save or share the Excel file" });
}

// Downloads an archived month (the link is a short-lived signed address, so no login header is sent to it)
export async function downloadBackup(backupId: string) {
  const { url, filename } = await api.backupLink(backupId);
  const res = await fetch(url).catch(() => null);
  if (!res) throw new ApiError("Could not reach the server. Check your internet connection.", 0);
  if (!res.ok) throw new ApiError("Could not download the file.", res.status);
  await saveAndShare(await res.arrayBuffer(), filename);
}

// Downloads the Excel export and opens the share sheet (save to Files / Drive, or open in Excel)
export async function exportToExcel(templateId: string, slug: string, q: string) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/export?template=${encodeURIComponent(templateId)}&q=${encodeURIComponent(q)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => null);
  if (!res) throw new ApiError("Could not reach the server. Check your internet connection.", 0);
  if (!res.ok) throw new ApiError(res.status === 401 ? "Please sign in again." : "Could not create the Excel file.", res.status);

  await saveAndShare(await res.arrayBuffer(), `${slug}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
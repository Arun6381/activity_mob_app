// Address of your deployed website (the Next.js app). Change this, or set EXPO_PUBLIC_API_URL.
// It must be https for a release build, and must not end with a slash.
const rawUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://activity-tracker-ajt1-git-mobileappapi-arun6381s-projects.vercel.app";
export const API_URL = rawUrl.replace(/\/+$/, "");
export const VERCEL_BYPASS_TOKEN = process.env.EXPO_PUBLIC_VERCEL_BYPASS_TOKEN;

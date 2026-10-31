import { getToken } from "@/utils/auth";

export type HomeEntry = { id: string; title: string; subtitle: string; route: string; enabled: boolean; sort: number };
export type ServicePlan = { id: string; name: string; level: string; cycle: string; priceFen: number; description: string; enabled: boolean };
export type ContentSettings = { resultDisclaimer: string; resultConsultationTitle: string; resultConsultationDescription: string };
export type ConsultantCategory = { id: string; name: string; count: number; enabled: boolean; sort: number };
const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api/v1").replace(/\/$/, "");
async function request<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try { const token = getToken(); const response = await fetch(`${base}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token?.accessToken ? { Authorization: `Bearer ${token.accessToken}` } : {}), ...(init?.headers ?? {}) } }); const body = await response.json() as { data?: T; message?: string }; if (!response.ok) { if (init?.method === "PUT") throw new Error(body.message || "保存失败"); return fallback; } return body.data ?? fallback; } catch (error) { if (init?.method === "PUT") throw error; return fallback; }
}
export const healthAiApi = {
  listHomeEntries: (fallback: HomeEntry[]) => request("/home-entries", fallback),
  saveHomeEntries: (data: HomeEntry[]) => request("/home-entries", data, { method: "PUT", body: JSON.stringify(data) }),
  listContentSettings: (fallback: ContentSettings) => request("/content-settings", fallback),
  saveContentSettings: (data: ContentSettings) => request("/content-settings", data, { method: "PUT", body: JSON.stringify(data) }),
  listPlans: (fallback: ServicePlan[]) => request("/plans", fallback),
  savePlans: (data: ServicePlan[]) => request("/plans", data, { method: "PUT", body: JSON.stringify(data) }),
  listConsultantCategories: (fallback: ConsultantCategory[]) => request("/consultant-categories", fallback),
  saveConsultantCategories: (data: ConsultantCategory[]) => request("/consultant-categories", data, { method: "PUT", body: JSON.stringify(data) })
};

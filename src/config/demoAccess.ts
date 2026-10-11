export interface DemoKeyConfig {
  key: string;
  label: string;
  expiresAt: string; // ISO date string
}

export const DEMO_KEYS: DemoKeyConfig[] = [
  { key: "park-cafe-demo", label: "İlqar", expiresAt: "2026-10-20T23:59:59" }
];
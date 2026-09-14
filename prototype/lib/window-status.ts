export type WindowStatus = "NONE" | "ACTIVE" | "EXPIRING" | "EXPIRED";

export const WINDOW_EXPIRING_THRESHOLD_MS = 4 * 60 * 60 * 1000;

export function getWindowStatus(expiresAt: string | null, now: Date = new Date()): WindowStatus {
  if (!expiresAt) return "NONE";

  const remainingMs = new Date(expiresAt).getTime() - now.getTime();
  if (remainingMs <= 0) return "EXPIRED";
  if (remainingMs <= WINDOW_EXPIRING_THRESHOLD_MS) return "EXPIRING";
  return "ACTIVE";
}

export function formatWindowRemaining(expiresAt: string, now: Date = new Date()): string {
  const remainingMs = new Date(expiresAt).getTime() - now.getTime();
  if (remainingMs <= 0) return "";

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

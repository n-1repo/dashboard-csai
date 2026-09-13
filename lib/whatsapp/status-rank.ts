import type { MessageStatus } from "@/types/database";

const STATUS_RANK: Record<MessageStatus, number> = {
  RECEIVED: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
  FAILED: 4,
};

export function shouldApplyStatus(current: MessageStatus, incoming: MessageStatus) {
  if (current === "FAILED") return false;
  if (incoming === "FAILED") return true;
  return STATUS_RANK[incoming] > STATUS_RANK[current];
}

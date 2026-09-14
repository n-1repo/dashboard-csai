import { AlertCircle, CircleDot, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WindowStatus } from "@/lib/window-status";

const ICON_BY_STATUS = {
  ACTIVE: CircleDot,
  EXPIRING: Clock,
  EXPIRED: AlertCircle,
} as const;

const COLOR_BY_STATUS: Record<keyof typeof ICON_BY_STATUS, string> = {
  ACTIVE: "text-primary",
  EXPIRING: "text-status-expiring",
  EXPIRED: "text-status-failed",
};

interface WindowStatusIconProps {
  status: Exclude<WindowStatus, "NONE">;
  className?: string;
}

export function WindowStatusIcon({ status, className }: WindowStatusIconProps) {
  const Icon = ICON_BY_STATUS[status];
  return <Icon aria-hidden="true" className={cn("size-3.5 shrink-0", COLOR_BY_STATUS[status], className)} />;
}

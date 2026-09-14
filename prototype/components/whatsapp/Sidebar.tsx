"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlarmClock, MessageSquare, Settings, Users, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { OperatorSession } from "@/hooks/useRealtimeAuth";

interface SidebarProps {
  operator: OperatorSession | null;
  unreadTotal?: number;
  followUpCount?: number;
  onOpenFollowUps?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Chats", icon: MessageSquare },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
];

export function Sidebar({ operator, unreadTotal = 0, followUpCount = 0, onOpenFollowUps }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useStore();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = operator?.displayName
    ? operator.displayName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OP";

  return (
    <nav className="flex h-full w-16 shrink-0 flex-col items-center justify-between border-r border-border bg-panel-raised py-4">
      <div className="flex flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "relative flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground",
                isActive && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.href === "/dashboard" && unreadTotal > 0 ? (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {unreadTotal > 9 ? "9+" : unreadTotal}
                </span>
              ) : null}
            </Link>
          );
        })}

        {onOpenFollowUps ? (
          <button
            type="button"
            onClick={onOpenFollowUps}
            aria-label="Follow-ups"
            className="relative flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <AlarmClock className="size-5" aria-hidden="true" />
            {followUpCount > 0 ? (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-status-expiring text-[10px] font-semibold text-background">
                {followUpCount > 9 ? "9+" : followUpCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Link
          href="/dashboard/settings"
          aria-label="Settings"
          className={cn(
            "flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground",
            pathname === "/dashboard/settings" && "bg-primary/10 text-primary",
          )}
        >
          <Settings className="size-5" aria-hidden="true" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full p-0" aria-label="Account menu">
              <Avatar className="size-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {operator?.email ?? "..."}
            </div>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

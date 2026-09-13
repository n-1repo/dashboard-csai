import { MessageSquare } from "lucide-react";

export function EmptyChat() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 bg-panel text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-panel-hover text-muted-foreground">
        <MessageSquare className="size-8" />
      </div>
      <div className="text-lg text-foreground">WA Cloud Logger</div>
      <p className="max-w-xs text-sm text-muted-foreground">
        Pilih percakapan di sebelah kiri untuk melihat riwayat chat dan membalas pesan.
      </p>
    </div>
  );
}

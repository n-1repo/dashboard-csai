import { formatDateSeparator } from "@/lib/format";

export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-lg bg-panel-hover px-3 py-1 text-xs text-muted-foreground">
        {formatDateSeparator(date)}
      </span>
    </div>
  );
}

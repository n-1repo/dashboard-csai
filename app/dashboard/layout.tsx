export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-dvh w-full overflow-hidden bg-panel">{children}</div>;
}

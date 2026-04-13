import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <WifiOff className="mx-auto h-10 w-10" style={{ color: "hsl(var(--ll-text-muted))" }} />
        <p className="text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          You&apos;re offline
        </p>
        <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          Check your connection and try again.
        </p>
      </div>
    </div>
  );
}

import { SidebarV2 } from "@/components/dashboard/v2/sidebar";
import { HeaderV2 } from "@/components/dashboard/v2/header";
import { AuthGuard } from "@/components/dashboard/auth-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { ShortcutsProvider } from "@/components/dashboard/shortcuts-provider";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ShortcutsProvider>
      <div className="flex h-screen overflow-hidden bg-[hsl(var(--v2-bg))] text-[hsl(var(--v2-text-primary))]">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:shrink-0">
          <SidebarV2 />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <HeaderV2 />
          <main className="flex-1 overflow-y-auto px-8 py-8 pb-24 lg:pb-8">
            <ErrorBoundary>
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      </ShortcutsProvider>
    </AuthGuard>
  );
}

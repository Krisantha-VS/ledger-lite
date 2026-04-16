import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { AuthGuard } from "@/components/dashboard/auth-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { ShortcutsProvider } from "@/components/dashboard/shortcuts-provider";
import { CheckoutHandler } from "@/components/dashboard/checkout-handler";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ShortcutsProvider>
      <CheckoutHandler />
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--ll-bg-base)" }}>
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 lg:px-6 lg:pb-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
      </ShortcutsProvider>
    </AuthGuard>
  );
}

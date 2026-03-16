"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ledger-lite] Uncaught error:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl p-8 text-center"
          style={{ background: "var(--ll-bg-surface)", border: "1px solid hsl(var(--ll-border))" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "hsl(var(--ll-expense) / 0.1)" }}
          >
            <AlertTriangle className="h-6 w-6" style={{ color: "hsl(var(--ll-expense))" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
              Something went wrong
            </p>
            <p className="mt-1 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
              {this.state.error.message}
            </p>
          </div>
          <button
            onClick={this.reset}
            className="ll-focus-ring flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

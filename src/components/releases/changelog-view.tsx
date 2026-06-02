import { RELEASES, formatReleaseDate } from "@/lib/changelog";
import type { ChangeType } from "@/lib/changelog";

const TYPE_LABEL: Record<ChangeType, string> = {
  New:      "New",
  Improved: "Improved",
  Fixed:    "Fixed",
};

export function ChangelogView() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Release Notes
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "hsl(var(--ll-text-muted))" }}>
          A record of every update, improvement, and fix.
        </p>
      </div>

      <div className="space-y-12">
        {RELEASES.map((release, idx) => (
          <div key={release.version}>
            {/* Version header */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "hsl(var(--ll-text-muted))" }}
              >
                v{release.version}
              </span>
              <span className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                {formatReleaseDate(release.date)}
              </span>
              {idx === 0 && (
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background: "hsl(var(--ll-accent) / 0.1)",
                    color:      "hsl(var(--ll-accent))",
                  }}
                >
                  Latest
                </span>
              )}
            </div>

            <h2
              className="mt-1.5 text-lg font-semibold"
              style={{ color: "hsl(var(--ll-text-primary))" }}
            >
              {release.title}
            </h2>

            <p className="mt-1 text-sm" style={{ color: "hsl(var(--ll-text-secondary))" }}>
              {release.summary}
            </p>

            {/* Change list */}
            <ul className="mt-5 space-y-3">
              {release.changes.map((change, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none"
                    style={
                      change.type === "New"
                        ? { background: "hsl(var(--ll-accent) / 0.08)", color: "hsl(var(--ll-accent))" }
                        : change.type === "Improved"
                        ? { background: "hsl(var(--ll-income) / 0.08)", color: "hsl(var(--ll-income))" }
                        : { background: "hsl(var(--ll-expense) / 0.08)", color: "hsl(var(--ll-expense))" }
                    }
                  >
                    {TYPE_LABEL[change.type]}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                    {change.description}
                  </span>
                </li>
              ))}
            </ul>

            {/* Divider between releases */}
            {idx < RELEASES.length - 1 && (
              <div className="mt-10 border-t" style={{ borderColor: "hsl(var(--ll-border))" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

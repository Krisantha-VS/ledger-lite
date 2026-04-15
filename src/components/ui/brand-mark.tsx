interface BrandMarkProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * LedgerLite brand mark — sparkline (rising trend line + dot).
 * Drop-in replacement for the Wallet icon in logo contexts.
 * Uses currentColor so it inherits whatever color is set on the container.
 */
export function BrandMark({ className, style }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <polyline
        points="3,24 9,17 15,20 21,11 27,7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="7" r="3" fill="currentColor" />
    </svg>
  );
}

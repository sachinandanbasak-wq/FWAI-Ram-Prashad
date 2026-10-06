/**
 * A stylised fighter-jet silhouette used as a defence motif.
 * Presentational only; colour follows the surrounding text colour (currentColor).
 */
export function Jet({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      role="img"
    >
      <path d="M32 3 L35 21 L58 37 L58 43 L35 34 L34 50 L45 59 L45 61 L32 57 L19 61 L19 59 L30 50 L29 34 L2 43 L2 37 L25 21 Z" />
    </svg>
  );
}

/** The three bands of the Indian flag, as a thin bar or block. */
export function TricolourBar({ className = "" }: { className?: string }) {
  return (
    <span className={`flex overflow-hidden ${className}`} aria-hidden="true">
      <span className="flex-1 bg-[#FF9933]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#138808]" />
    </span>
  );
}

/**
 * An Indian flag that looks like it is blowing in the wind.
 *
 * How it works: the flag bands and the Ashoka Chakra are drawn flat, then clipped
 * to a wave shape whose top and bottom edges are two smooth curves that travel
 * along the flag and swap phase. The pole edge (x = 0) is fixed, so the far end
 * ripples while the hoist stays put — a cloth wave, not a shake. There is no
 * random noise, so the motion is smooth and continuous. No JavaScript needed.
 */

const WAVE_A =
  "M0 5 C12 0, 22 10, 32 5 C42 0, 52 10, 60 5 L60 35 C52 40, 42 30, 32 35 C22 40, 12 30, 0 35 Z";
const WAVE_B =
  "M0 5 C12 10, 22 0, 32 5 C42 10, 52 0, 60 5 L60 35 C52 30, 42 40, 32 35 C22 30, 12 40, 0 35 Z";

export function IndianFlag({ className = "" }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i);

  return (
    <svg
      viewBox="0 0 60 40"
      className={`flag-float ${className}`}
      role="img"
      aria-label="Indian flag blowing in the wind"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id="flagCloth">
          <path d={WAVE_A}>
            <animate
              attributeName="d"
              dur="4s"
              values={`${WAVE_A};${WAVE_B};${WAVE_A}`}
              calcMode="spline"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
              repeatCount="indefinite"
            />
          </path>
        </clipPath>
      </defs>

      <g clipPath="url(#flagCloth)">
        <rect x="0" y="0" width="60" height="13.34" fill="#FF9933" />
        <rect x="0" y="13.33" width="60" height="13.34" fill="#FFFFFF" />
        <rect x="0" y="26.66" width="60" height="13.34" fill="#138808" />

        {/* Ashoka Chakra */}
        <g>
          <circle cx="30" cy="20" r="4.1" fill="none" stroke="#000080" strokeWidth="0.5" />
          {spokes.map((i) => (
            <line
              key={i}
              x1="30"
              y1="20"
              x2="30"
              y2="16.4"
              stroke="#000080"
              strokeWidth="0.35"
              transform={`rotate(${i * 15} 30 20)`}
            />
          ))}
          <circle cx="30" cy="20" r="0.7" fill="#000080" />
        </g>
      </g>

      {/* A soft pole edge so the hoist reads as fixed while the cloth ripples. */}
      <rect x="0" y="4" width="1" height="32" fill="rgba(0,0,0,0.35)" />
    </svg>
  );
}

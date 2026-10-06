/**
 * An Indian flag that appears to float and ripple on the air, continuously.
 *
 * Two effects combine:
 *  1. A live SVG turbulence filter warps the cloth and the warp itself animates,
 *     so the ripple never stops (no JavaScript needed).
 *  2. The `.flag-float` CSS keyframes gently lift, tilt and pivot the flag from
 *     its left edge, so it reads as hanging and fluttering in the breeze.
 */
export function IndianFlag({ className = "" }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i);

  return (
    <svg
      viewBox="0 0 60 40"
      className={`flag-float ${className}`}
      role="img"
      aria-label="Indian flag"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="flagRipple" x="-20%" y="-25%" width="140%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.05"
            numOctaves={2}
            seed={7}
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="7s"
              values="0.012 0.05;0.02 0.075;0.012 0.05"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <g filter="url(#flagRipple)">
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
    </svg>
  );
}

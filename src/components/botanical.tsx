/**
 * Line drawing of a tulip with one petal drifting away: the thing Petal counts.
 * Strokes draw themselves in on load (long dash + the `draw` animation).
 */
export function Botanical({ className = "" }: { className?: string }) {
  const stroke = "motion-safe:animate-draw [stroke-dasharray:1000]";

  return (
    <svg
      viewBox="0 0 240 430"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {/* Leaves: faint wash, then outline and midrib. */}
      <g className="text-moss" stroke="currentColor" strokeWidth={1.25}>
        <path
          d="M121 300 C 90 290, 62 262, 52 226 C 86 232, 112 258, 121 300 Z"
          className="fill-sage-wash/70"
          stroke="none"
        />
        <path
          d="M125 236 C 152 222, 176 190, 182 152 C 152 164, 130 196, 125 236 Z"
          className="fill-sage-wash/70"
          stroke="none"
        />
        <path
          className={`${stroke} [animation-delay:200ms]`}
          d="M120 418 C 118 336, 132 262, 122 172 C 117 128, 123 104, 126 90"
        />
        <path
          className={`${stroke} [animation-delay:700ms]`}
          d="M121 300 C 90 290, 62 262, 52 226 C 86 232, 112 258, 121 300 Z"
        />
        <path
          className={`${stroke} [animation-delay:900ms]`}
          d="M121 300 C 98 276, 76 250, 52 226"
          strokeWidth={0.75}
        />
        <path
          className={`${stroke} [animation-delay:1000ms]`}
          d="M125 236 C 152 222, 176 190, 182 152 C 152 164, 130 196, 125 236 Z"
        />
        <path
          className={`${stroke} [animation-delay:1200ms]`}
          d="M125 236 C 142 210, 162 180, 182 152"
          strokeWidth={0.75}
        />
      </g>

      {/* Bloom. */}
      <g className="text-rose-deep" stroke="currentColor" strokeWidth={1.25}>
        <path
          d="M126 90 C 106 82, 98 50, 110 20 C 118 32, 123 38, 126 46 C 129 38, 134 32, 142 20 C 154 50, 146 82, 126 90 Z"
          className="fill-rose-wash"
          stroke="none"
        />
        <path
          className={`${stroke} [animation-delay:1300ms]`}
          d="M126 90 C 106 82, 98 50, 110 20 C 118 32, 123 38, 126 46 C 129 38, 134 32, 142 20 C 154 50, 146 82, 126 90 Z"
        />
        <path
          className={`${stroke} [animation-delay:1700ms]`}
          d="M126 90 C 121 72, 121 58, 126 46"
          strokeWidth={0.75}
        />
      </g>

      {/* The dropped petal. */}
      <g className="motion-safe:animate-drift [transform-box:fill-box] [transform-origin:center]">
        <path
          d="M186 352 C 196 340, 214 342, 218 356 C 206 366, 192 364, 186 352 Z"
          className="fill-rose text-rose-deep"
          stroke="currentColor"
          strokeWidth={1}
        />
      </g>

      {/* Ground line. */}
      <path d="M40 418 H 210" className="text-hairline" stroke="currentColor" strokeWidth={1} />
    </svg>
  );
}

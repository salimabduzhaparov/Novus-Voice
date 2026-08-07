/**
 * The orbital-arc mark: a 270° arc with a satellite dot, on the meridian
 * gradient. Used in the sidebar lockup, Nova's transcript avatar, and the
 * auth page.
 */
export function ArcMark({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-meridian shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* 270° arc */}
        <path
          d="M 12 3 A 9 9 0 1 0 21 12"
          stroke="#F2F5FA"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* satellite */}
        <circle cx="21" cy="7" r="2.4" fill="#F2F5FA" />
      </svg>
    </span>
  );
}

export function Lockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <ArcMark size={26} />
      {!compact && (
        <span className="text-[14.5px] font-semibold tracking-tight text-ink-50">
          Novus&nbsp;Voice
        </span>
      )}
    </span>
  );
}

/** The 270° arc as a loading spinner — literally the logo in motion. */
export function OrbitSpinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="orbit-spinner"
      aria-label="Loading"
      role="status"
    >
      <path
        d="M 12 3 A 9 9 0 1 0 21 12"
        stroke="#6FAEFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

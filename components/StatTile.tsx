import { EstimatedChip } from "@/components/Badge";

export function StatTile({
  label,
  value,
  sub,
  delta,
  upIsGood = true,
  estimated = false,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  upIsGood?: boolean;
  estimated?: boolean;
  href?: string;
}) {
  const deltaEl =
    delta == null ? null : (
      <span
        className={`inline-flex items-baseline gap-1 text-[13px] font-semibold ${
          delta === 0
            ? "text-ink-300"
            : (delta > 0) === upIsGood
              ? "text-good-300"
              : "text-bad-400"
        }`}
      >
        <span aria-hidden className="text-[10px]">
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "–"}
        </span>
        {Math.abs(delta)}%
        <span className="sr-only">
          {delta > 0 ? "up" : "down"} {Math.abs(delta)} percent versus the prior
          period
        </span>
      </span>
    );

  const inner = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-card-title text-ink-200">{label}</span>
        {estimated && <EstimatedChip />}
      </div>
      <div className="mt-1 flex items-baseline gap-2.5">
        <span className="text-stat text-ink-50">{value}</span>
        {deltaEl}
      </div>
      {sub && <p className="text-caption text-ink-300 mt-1">{sub}</p>}
    </>
  );

  const cls =
    "block rounded-xl border border-edge bg-ink-900 p-5 min-h-[112px] transition-colors";

  if (href) {
    return (
      <a href={href} className={`${cls} hover:border-edge-strong`}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export function StatTileCta({
  label,
  message,
  actionLabel,
  href,
}: {
  label: string;
  message: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-edge-strong bg-ink-900 p-5 min-h-[112px]">
      <span className="text-card-title text-ink-200">{label}</span>
      <p className="text-caption text-ink-300 mt-1.5">{message}</p>
      <a
        href={href}
        className="inline-flex mt-2 text-caption font-semibold text-arc-300 hover:text-arc-200"
      >
        {actionLabel} →
      </a>
    </div>
  );
}

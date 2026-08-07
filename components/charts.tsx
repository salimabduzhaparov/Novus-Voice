/**
 * Hand-rolled inline SVG charts — server-renderable, zero dependencies,
 * CSS-only hover tooltips (Tailwind group-hover on SVG groups).
 * Geometry and palette per the validated Novus dataviz spec.
 */

export interface DayPoint {
  key: string; // YYYY-MM-DD in business tz
  label: string; // short label for the axis
  labelFull: string; // for the tooltip / aria
  count: number;
}

export function VolumeChart({
  days,
  title,
  totalNote,
}: {
  days: DayPoint[];
  title: string;
  totalNote: string;
}) {
  const W = 640;
  const H = 240;
  const padTop = 16;
  const padRight = 12;
  const padBottom = 30;
  const padLeft = 34;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;
  const baseline = padTop + plotH;

  const max = Math.max(1, ...days.map((d) => d.count));
  const step = max <= 8 ? 2 : max <= 20 ? 5 : max <= 40 ? 10 : max <= 100 ? 25 : 50;
  const yMax = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);

  const bw = plotW / days.length;
  const barW = Math.min(24, bw * 0.6);
  const y = (v: number) => baseline - (plotH * v) / yMax;

  const peak = days.reduce(
    (best, d, i) => (d.count > days[best].count ? i : best),
    0,
  );

  return (
    <div className="rounded-xl border border-edge bg-ink-900 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-card-title text-ink-200">{title}</h2>
        <span className="text-caption text-ink-300">{totalNote}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={title}>
        {/* gridlines + y ticks */}
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={padLeft}
              x2={W - padRight}
              y1={y(v)}
              y2={y(v)}
              stroke={v === 0 ? "#26324A" : "#1B2536"}
              strokeWidth="1"
            />
            <text
              x={padLeft - 6}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="11"
              fill="#75829C"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {v}
            </text>
          </g>
        ))}

        {days.map((d, i) => {
          const bx = padLeft + i * bw + (bw - barW) / 2;
          const by = y(d.count);
          const h = baseline - by;
          const r = Math.min(4, barW / 2, Math.max(0, h));
          const tipW = 128;
          const tipX = Math.min(
            Math.max(bx + barW / 2 - tipW / 2, padLeft),
            W - padRight - tipW,
          );
          const tipAbove = by >= 70;
          const tipY = tipAbove ? by - 54 : by + 10;
          return (
            <g key={d.key} className="group" tabIndex={0} role="img" aria-label={`${d.labelFull}: ${d.count} calls`}>
              {/* oversized invisible hit target */}
              <rect
                x={padLeft + i * bw}
                y={padTop}
                width={bw}
                height={plotH}
                fill="transparent"
              />
              {/* bar with rounded data-end */}
              {d.count > 0 ? (
                <path
                  d={`M ${bx} ${baseline} V ${by + r} Q ${bx} ${by} ${bx + r} ${by} H ${bx + barW - r} Q ${bx + barW} ${by} ${bx + barW} ${by + r} V ${baseline} Z`}
                  fill="#4191F4"
                  className="transition-[fill] group-hover:fill-[#97C4FF] group-focus-visible:fill-[#97C4FF]"
                />
              ) : (
                <rect x={bx} y={baseline - 2} width={barW} height={2} rx={1} fill="#26324A" />
              )}
              {/* peak label */}
              {i === peak && d.count > 0 && (
                <text
                  x={bx + barW / 2}
                  y={by - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#A9B4C9"
                >
                  {d.count}
                </text>
              )}
              {/* x label */}
              <text
                x={padLeft + i * bw + bw / 2}
                y={H - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#75829C"
              >
                {d.label}
              </text>
              {/* tooltip */}
              <g className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                <rect
                  x={tipX}
                  y={tipY}
                  width={tipW}
                  height={44}
                  rx={8}
                  fill="#16223A"
                  stroke="rgba(199,214,240,0.16)"
                />
                <text x={tipX + 12} y={tipY + 18} fontSize="11" fill="#75829C">
                  {d.labelFull}
                </text>
                <text x={tipX + 12} y={tipY + 34} fontSize="13" fontWeight="600" fill="#F2F5FA">
                  {d.count} {d.count === 1 ? "call" : "calls"}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* screen-reader table twin */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Calls</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <td>{d.labelFull}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface OutcomeSegment {
  key: string;
  label: string;
  count: number;
  color: string; // 500-step fill
  hover: string; // 400-step
  href: string;
}

export function OutcomesBar({
  segments,
  title,
  totalNote,
}: {
  segments: OutcomeSegment[];
  title: string;
  totalNote: string;
}) {
  const nonZero = segments.filter((s) => s.count > 0);
  const total = nonZero.reduce((a, s) => a + s.count, 0);
  const W = 640;
  const GAP = 2;

  let widths: number[] = [];
  if (total > 0) {
    const avail = W - GAP * Math.max(0, nonZero.length - 1);
    widths = nonZero.map((s) => Math.max(4, (avail * s.count) / total));
    const excess = widths.reduce((a, w) => a + w, 0) - avail;
    if (excess > 0) {
      const iMax = widths.indexOf(Math.max(...widths));
      widths[iMax] -= excess;
    }
  }

  const sorted = [...segments].sort((a, b) => {
    const tail = (k: string) => (k === "spam" ? 1 : k === "no_outcome" ? 2 : 0);
    return tail(a.key) - tail(b.key) || b.count - a.count;
  });

  return (
    <div className="rounded-xl border border-edge bg-ink-900 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-card-title text-ink-200">{title}</h2>
        <span className="text-caption text-ink-300">{totalNote}</span>
      </div>

      {total === 0 ? (
        <div className="h-[14px] rounded-full bg-ink-850" />
      ) : (
        <svg viewBox={`0 0 ${W} 14`} className="w-full h-auto" role="img" aria-label={title}>
          {(() => {
            let x = 0;
            return nonZero.map((s, i) => {
              const w = widths[i];
              const isFirst = i === 0;
              const isLast = i === nonZero.length - 1;
              const r = 7;
              const seg = (
                <g key={s.key} className="group">
                  <path
                    d={
                      `M ${x + (isFirst ? r : 0)} 0` +
                      ` H ${x + w - (isLast ? r : 0)}` +
                      (isLast
                        ? ` Q ${x + w} 0 ${x + w} ${r} V ${14 - r} Q ${x + w} 14 ${x + w - r} 14`
                        : ` V 14`) +
                      ` H ${x + (isFirst ? r : 0)}` +
                      (isFirst
                        ? ` Q ${x} 14 ${x} ${14 - r} V ${r} Q ${x} 0 ${x + r} 0`
                        : ` V 0`) +
                      " Z"
                    }
                    fill={s.color}
                    className="transition-opacity group-hover:opacity-80"
                  >
                    <title>{`${s.label} · ${s.count} · ${Math.round((s.count / total) * 100)}%`}</title>
                  </path>
                </g>
              );
              x += w + GAP;
              return seg;
            });
          })()}
        </svg>
      )}

      {/* legend table — doubles as the accessible data view */}
      <div className="mt-3 space-y-0.5">
        {sorted.map((s) => (
          <a
            key={s.key}
            href={s.href}
            className="grid grid-cols-[16px_1fr_auto_3rem] items-center gap-3 h-9 rounded-lg px-2 hover:bg-white/[0.03] transition-colors"
          >
            <span
              className="size-2.5 rounded-[3px] justify-self-start"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="text-card-title text-ink-200">{s.label}</span>
            <span
              className="text-num font-semibold text-ink-50"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {s.count}
            </span>
            <span className="text-caption text-ink-300 text-right">
              {total > 0 ? `${Math.round((s.count / total) * 100)}%` : "0%"}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

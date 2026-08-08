/**
 * Tiny hand-rolled icon set — one consistent 1.5-stroke style, zero
 * dependencies. Each icon takes a size and inherits currentColor.
 */
export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const path = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {path}
    </svg>
  );
}

export type IconName =
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "phone-ring"
  | "bot"
  | "calendar-check"
  | "phone-missed"
  | "voicemail-off"
  | "moon"
  | "shield"
  | "zap"
  | "sparkle"
  | "grid"
  | "phone"
  | "users"
  | "calendar"
  | "gear"
  | "home"
  | "wrench"
  | "flame"
  | "leaf"
  | "scissors"
  | "bolt"
  | "droplet";

const PATHS: Record<IconName, React.ReactNode> = {
  mail: (
    <>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 6l7 5 7-5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="9" width="11" height="8" rx="2" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </>
  ),
  eye: (
    <>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.25" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M4 4l12 12" />
      <path d="M8.6 5.1A8.6 8.6 0 0 1 10 5c5 0 8 5 8 5a14.6 14.6 0 0 1-2.5 3M5.4 6.9A14 14 0 0 0 2 10s3 5 8 5c1 0 1.9-.2 2.7-.5" />
    </>
  ),
  "phone-ring": (
    <>
      <path d="M4 3.5h2.5L8 7l-1.8 1.3a10.5 10.5 0 0 0 4.5 4.5L12 11l3.5 1.5V15a1.5 1.5 0 0 1-1.6 1.5C8.1 16 4 11.9 3.5 6.1A1.5 1.5 0 0 1 4 3.5Z" />
      <path d="M12.5 3.5a4.5 4.5 0 0 1 4 4M12.8 6.2a2.2 2.2 0 0 1 1.6 1.6" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="6.5" width="12" height="9" rx="2.5" />
      <path d="M10 4v2.5M7.5 3.8h5" opacity="0" />
      <circle cx="10" cy="3.5" r="1" />
      <path d="M10 4.5v2" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <path d="M7.5 13.3c1.6 1 3.4 1 5 0" />
    </>
  ),
  "calendar-check": (
    <>
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M3 8.5h14M7 2.5V5M13 2.5V5" />
      <path d="M7.2 12.5l2 2 3.8-4" />
    </>
  ),
  "phone-missed": (
    <>
      <path d="M2.5 13.2a12.6 12.6 0 0 1 15 0l-2 2.6-3.2-1.3v-2a8.6 8.6 0 0 0-4.6 0v2l-3.2 1.3Z" />
      <path d="M6.5 3.5l7 4M13.5 3.5l-7 4" />
    </>
  ),
  "voicemail-off": (
    <>
      <circle cx="5.5" cy="11" r="2.75" />
      <circle cx="14.5" cy="11" r="2.75" />
      <path d="M5.5 13.75h9" />
      <path d="M3 3l14 14" />
    </>
  ),
  moon: (
    <path d="M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z" />
  ),
  shield: (
    <>
      <path d="M10 2.5l6 2.2v4.6c0 4-2.6 6.6-6 8.2-3.4-1.6-6-4.2-6-8.2V4.7Z" />
      <path d="M7.4 9.8l1.8 1.8 3.4-3.6" />
    </>
  ),
  zap: <path d="M11 2.5L4.5 11h4l-1 6.5L14.5 9h-4Z" />,
  sparkle: (
    <>
      <path d="M10 3l1.6 3.9L15.5 8.5l-3.9 1.6L10 14l-1.6-3.9L4.5 8.5l3.9-1.6Z" />
      <path d="M15.5 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
    </>
  ),
  grid: (
    <>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  phone: (
    <path d="M4 3.5h3l1.5 4-2 1.5a11 11 0 0 0 4.5 4.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C8.4 17.4 2.6 11.6 2.5 5.1A1.5 1.5 0 0 1 4 3.5Z" />
  ),
  users: (
    <>
      <circle cx="7" cy="6.5" r="3" />
      <path d="M2.5 16.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
      <path d="M13.5 8.5h4M15.5 6.5v4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14M7 2.5V5M13 2.5V5" />
      <path d="M7 12l2 2 4-4" />
    </>
  ),
  gear: (
    <>
      <circle cx="10" cy="10" r="2.75" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" />
    </>
  ),
  home: (
    <>
      <path d="M3 9.5L10 3l7 6.5" />
      <path d="M5 8.5V17h10V8.5" />
    </>
  ),
  wrench: (
    <path d="M13.6 2.9a4.3 4.3 0 0 0-5.4 5.4L3 13.5a1.8 1.8 0 1 0 3.5 3.5l5.2-5.2a4.3 4.3 0 0 0 5.4-5.4l-2.7 2.7-2.7-.8-.8-2.7Z" />
  ),
  flame: (
    <path d="M10 2.5s4.5 4 4.5 8.5a4.5 4.5 0 0 1-9 0c0-2 1-3.5 2-5 .3 1 1 2 2 2.5-.3-2 .5-4.5.5-6Z" />
  ),
  leaf: (
    <>
      <path d="M4 16C4 8 9 4 16.5 3.5 16 11 12 16 4 16Z" />
      <path d="M4 16c2.5-4.5 5.5-7.5 9-9.5" />
    </>
  ),
  scissors: (
    <>
      <circle cx="5" cy="6" r="2.25" />
      <circle cx="5" cy="14" r="2.25" />
      <path d="M7 7.5L17 14M7 12.5L17 6" />
    </>
  ),
  bolt: <path d="M11 2.5L4.5 11h4l-1 6.5L14.5 9h-4Z" />,
  droplet: (
    <path d="M10 2.5S15 8 15 11.5a5 5 0 0 1-10 0C5 8 10 2.5 10 2.5Z" />
  ),
};

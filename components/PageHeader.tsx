import { Icon, type IconName } from "@/components/Icons";

/**
 * Iconized page header — gives every section of the app a clear, branded
 * outline: icon chip + title + context line, with room for actions.
 */
export default function PageHeader({
  icon,
  title,
  caption,
  children,
}: {
  icon: IconName;
  title: string;
  caption?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-arc-400/25 bg-arc-400/[0.08] text-arc-300">
        <Icon name={icon} size={19} />
      </span>
      <div className="min-w-0">
        <h1 className="text-page-title text-ink-50">{title}</h1>
        {caption && (
          <p className="text-caption text-ink-300 mt-0.5">{caption}</p>
        )}
      </div>
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}

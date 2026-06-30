/** STRYDZ mark: two offset ellipses joined by a central stem, forming an S/Z flow.
 * Uses currentColor so it themes for light/dark — set color via className. */
export default function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 90) / 104}
      viewBox="0 0 104 90"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="STRYDZ"
    >
      <ellipse cx="60" cy="30" rx="42" ry="15" />
      <ellipse cx="44" cy="60" rx="42" ry="15" />
      <rect x="46" y="16" width="12" height="58" />
    </svg>
  );
}

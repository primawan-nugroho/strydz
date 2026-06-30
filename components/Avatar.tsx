export default function Avatar({
  name,
  src,
  size = 36,
}: {
  name: string;
  src: string | null;
  size?: number;
}) {
  // Strava returns a literal "avatar/..." placeholder path (not a real photo) when the
  // athlete hasn't set one — treat that the same as no picture.
  const hasPhoto = src && !src.includes("/avatar/");

  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-accent-bg flex items-center justify-center text-accent-text font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0)}
    </div>
  );
}

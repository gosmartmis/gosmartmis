interface UserAvatarProps {
  /** URL of the uploaded photo — null shows initials fallback */
  avatarUrl: string | null | undefined;
  /** 2-letter initials shown when no photo */
  initials: string;
  /** Tailwind size classes for the outer wrapper, e.g. "w-10 h-10" */
  sizeClass?: string;
  /** Tailwind gradient classes for the fallback circle */
  gradientClass?: string;
  /** "full" = circle, "xl" = rounded-xl, "2xl" = rounded-2xl */
  shape?: 'full' | 'xl' | '2xl';
  /** Extra classes forwarded to the wrapper */
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  initials,
  sizeClass = 'w-10 h-10',
  gradientClass = 'from-teal-500 to-emerald-600',
  shape = 'full',
  className = '',
}: UserAvatarProps) {
  const shapeClass =
    shape === 'full' ? 'rounded-full' : shape === 'xl' ? 'rounded-xl' : 'rounded-2xl';

  return (
    <div
      className={`${sizeClass} ${shapeClass} overflow-hidden flex-shrink-0 bg-gradient-to-br ${gradientClass} flex items-center justify-center ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={initials}
          className="w-full h-full object-cover object-top"
          onError={(e) => {
            // If the image fails to load, hide it so the initials show through
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="text-white font-bold text-sm select-none">{initials}</span>
      )}
    </div>
  );
}

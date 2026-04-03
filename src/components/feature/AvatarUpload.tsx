import { useRef, useState } from 'react';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';

type Shape = 'circle' | 'rounded';
type Size = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<Size, { wrapper: string; text: string; camera: string }> = {
  sm: { wrapper: 'w-16 h-16', text: 'text-lg', camera: 'w-6 h-6' },
  md: { wrapper: 'w-20 h-20', text: 'text-2xl', camera: 'w-7 h-7' },
  lg: { wrapper: 'w-24 h-24', text: 'text-3xl', camera: 'w-8 h-8' },
};

const SHAPE_MAP: Record<Shape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
};

export interface AvatarUploadProps {
  /** Supabase user ID — required to build the correct storage path */
  userId: string;
  /** Current avatar URL from profile (null = show initials) */
  currentUrl: string | null;
  /** 2-letter initials shown when there is no photo */
  initials: string;
  size?: Size;
  shape?: Shape;
  /** Called after a successful upload with the new public URL */
  onSuccess?: (url: string) => void;
}

export default function AvatarUpload({
  userId,
  currentUrl,
  initials,
  size = 'lg',
  shape = 'circle',
  onSuccess,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, uploading, error } = useAvatarUpload();
  const [localUrl, setLocalUrl] = useState<string | null>(currentUrl);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const s = SIZE_MAP[size];
  const shapeClass = SHAPE_MAP[shape];

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File too large. Max 5 MB allowed.');
      return;
    }

    // Optimistic preview
    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);

    const newUrl = await uploadAvatar(file, userId);
    if (newUrl) {
      setLocalUrl(newUrl);
      onSuccess?.(newUrl);
      showToast('success', 'Profile photo updated!');
    } else {
      // Revert preview on failure
      setLocalUrl(currentUrl);
      showToast('error', error ?? 'Upload failed. Please try again.');
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  return (
    <div className="relative inline-block">
      {/* Avatar display */}
      <div className={`${s.wrapper} ${shapeClass} overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center`}>
        {localUrl ? (
          <img
            src={localUrl}
            alt="Profile"
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <span className={`${s.text} font-bold text-white select-none`}>{initials}</span>
        )}

        {/* Upload overlay while uploading */}
        {uploading && (
          <div className={`absolute inset-0 ${shapeClass} bg-black/40 flex items-center justify-center`}>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Camera button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Change profile photo"
        className={`absolute bottom-0 right-0 ${s.camera} flex items-center justify-center bg-white rounded-full border border-gray-200 text-gray-600 hover:text-teal-600 hover:border-teal-300 transition-all cursor-pointer disabled:opacity-60`}
      >
        <i className="ri-camera-line text-xs" />
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50 shadow-md ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

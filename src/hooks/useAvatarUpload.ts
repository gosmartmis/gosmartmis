import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET = 'avatars';
let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    await fetch(
      `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/setup-avatar-bucket`,
      { method: 'GET' }
    );
    bucketReady = true;
  } catch {
    // best-effort; storage might already be configured
    bucketReady = true;
  }
}

export interface AvatarUploadResult {
  uploading: boolean;
  error: string | null;
  uploadAvatar: (file: File, userId: string) => Promise<string | null>;
}

export function useAvatarUpload(): AvatarUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = useCallback(async (file: File, userId: string): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      await ensureBucket();

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `${userId}/avatar.${ext}`;

      // Upload (upsert so camera button always replaces old photo)
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadErr) throw new Error(uploadErr.message);

      // Get the public URL (add cache-buster so the browser reloads the new image)
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Persist to profiles table
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateErr) throw new Error(updateErr.message);

      // Keep session cache in sync and notify all headers instantly
      sessionStorage.setItem('user_avatar_url', publicUrl);
      window.dispatchEvent(
        new CustomEvent('gosmart:avatar-updated', { detail: { url: publicUrl } })
      );

      return publicUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, error, uploadAvatar };
}

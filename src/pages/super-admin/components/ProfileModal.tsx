import { useState, useRef } from 'react';
import { supabase, type UserProfile } from '../../../lib/supabase';

interface Props {
  profile: UserProfile;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
}

async function uploadAvatarFile(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `avatar-${userId}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export default function ProfileModal({ profile, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    avatar_url: profile.avatar_url || '',
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setAvatarError('Only JPG, JPEG, and PNG files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File size must be under 5 MB.');
      return;
    }
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const url = await uploadAvatarFile(file, profile.id);
      set('avatar_url', url);
    } catch (err: any) {
      setAvatarError(err.message || 'Upload failed.');
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      setSaveError('Full name is required.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          avatar_url: form.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);

      // Update session storage
      sessionStorage.setItem('user_name', form.full_name.trim());

      setSaveSuccess(true);
      setTimeout(() => {
        onSaved({ ...profile, ...form, full_name: form.full_name.trim() });
        onClose();
      }, 800);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const initials = form.full_name
    ? form.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SA';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <i className="ri-user-settings-line text-rose-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
              <p className="text-xs text-gray-500">Update your name, photo and contact info</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">

          {/* Avatar section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white ring-2 ring-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white ring-2 ring-gray-200">
                  {initials}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                  <i className="ri-loader-4-line animate-spin text-rose-500 text-2xl"></i>
                </div>
              )}
            </div>

            {/* Upload button */}
            <div className="flex flex-col items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleAvatarFile}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  avatarUploading
                    ? 'border-rose-300 bg-rose-50 text-rose-400 cursor-wait'
                    : 'border-gray-300 text-gray-600 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                {avatarUploading ? (
                  <><i className="ri-loader-4-line animate-spin"></i>Uploading...</>
                ) : (
                  <><i className="ri-camera-line"></i>Change Photo</>
                )}
              </label>
              <span className="text-xs text-gray-400">JPG, JPEG, PNG — max 5 MB</span>
              {avatarError && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <i className="ri-error-warning-line"></i>{avatarError}
                </p>
              )}
              {form.avatar_url && (
                <button
                  type="button"
                  onClick={() => set('avatar_url', '')}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer mt-1"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed from here.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
              />
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <i className="ri-error-warning-line text-red-500 shrink-0"></i>
              <p className="text-sm text-red-600">{saveError}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <i className="ri-checkbox-circle-line text-green-500 shrink-0"></i>
              <p className="text-sm text-green-600 font-medium">Profile updated successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || avatarUploading}
            className="px-5 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <><i className="ri-loader-4-line animate-spin"></i>Saving...</>
            ) : (
              <><i className="ri-save-line"></i>Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

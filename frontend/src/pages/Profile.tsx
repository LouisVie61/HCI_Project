import { FormEvent, useMemo, useState } from 'react';
import { Camera, CheckCircle2, Loader2, LogOut, Mail, Phone, Save, UserCircle, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { formatDate as formatUserDate } from '../components/dashboard/dashboardUtils';
import { useAuth } from '../hooks';
import type { User, UserUpdate } from '../types';
import { validators } from '../utils';

interface ProfileFormState {
  full_name: string;
  email: string;
  phone_number: string;
}

const getAvatarSrc = (avatarUrl?: string | null) => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE_URL}${avatarUrl}`;
};

export const Profile = () => {
  const { user, loading, error, updateProfile, uploadAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <PanelShell
        eyebrow="Account"
        title="Profile"
        description="Update your user information, contact email, phone number, and avatar."
      >
        <NoticeState tone="neutral" title="Loading profile" message="Please wait a moment." />
      </PanelShell>
    );
  }

  return (
    <ProfileForm
      key={user.id}
      user={user}
      loading={loading}
      error={error}
      saved={saved}
      setSaved={setSaved}
      updateProfile={updateProfile}
      uploadAvatar={uploadAvatar}
      onLogout={handleLogout}
    />
  );
};

const ProfileForm = ({
  user,
  loading,
  error,
  saved,
  setSaved,
  updateProfile,
  uploadAvatar,
  onLogout,
}: {
  user: User;
  loading: boolean;
  error: string | null;
  saved: boolean;
  setSaved: (saved: boolean) => void;
  updateProfile: (profile: UserUpdate) => Promise<User | null>;
  uploadAvatar: (avatar: File) => Promise<User | null>;
  onLogout: () => Promise<void>;
}) => {
  const [form, setForm] = useState<ProfileFormState>({
    full_name: user.full_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
  });
  const [validationError, setValidationError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(getAvatarSrc(user.avatar_url));

  const displayName = useMemo(() => user.full_name?.trim() || 'Unnamed user', [user.full_name]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setValidationError('');
  };

  const handleAvatarChange = async (file?: File) => {
    setSaved(false);
    setValidationError('');

    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setValidationError('Avatar must be a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setValidationError('Avatar must be 2MB or smaller.');
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    const updatedUser = await uploadAvatar(file);
    if (updatedUser) {
      setAvatarPreview(getAvatarSrc(updatedUser.avatar_url));
      setSaved(true);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationError('');
    setSaved(false);

    if (!validators.isNotEmpty(form.full_name)) {
      setValidationError('Please enter a display name.');
      return;
    }

    if (!validators.email(form.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!validators.phone(form.phone_number)) {
      setValidationError('Phone number must contain 9 to 15 digits and may start with +.');
      return;
    }

    const updatedUser = await updateProfile({
      full_name: form.full_name,
      email: form.email,
      phone_number: form.phone_number || null,
    });

    if (updatedUser) {
      setSaved(true);
    }
  };

  return (
    <PanelShell
      eyebrow="Account"
      title="Profile"
      description="Update your user information, contact email, phone number, and avatar."
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex size-24 items-center justify-center overflow-hidden rounded-3xl bg-slate-950 text-white">
            {avatarPreview ? (
              <img src={avatarPreview} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="size-12" />
            )}
          </div>
          <h3 className="mt-5 text-xl font-semibold text-slate-950">{displayName}</h3>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>

          <label className="mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={loading}
              onChange={(event) => handleAvatarChange(event.target.files?.[0])}
            />
          </label>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-950">Update information</h3>
            <p className="mt-1 text-sm text-slate-500">Email and phone number must be unique across accounts.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <ProfileInput
              icon={UserCircle}
              label="Display name"
              value={form.full_name}
              onChange={(value) => handleChange('full_name', value)}
              placeholder="Alex Nguyen"
            />
            <ProfileInput
              icon={Mail}
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => handleChange('email', value)}
              placeholder="you@example.com"
            />
            <ProfileInput
              icon={Phone}
              label="Phone number"
              value={form.phone_number}
              onChange={(value) => handleChange('phone_number', value)}
              placeholder="0901234567"
            />

            {(validationError || error) && (
              <NoticeState tone="danger" title="Could not update profile" message={validationError || error || ''} />
            )}
            {saved && <NoticeState tone="neutral" title="Profile saved" message="Your profile has been updated." />}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-950">Account information</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={user.email || 'Not set'} />
            <InfoRow icon={CheckCircle2} label="Created" value={formatUserDate(user.created_at)} />
          </div>
        </section>
      </div>
    </PanelShell>
  );
};

const ProfileInput = ({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
      />
    </div>
  </label>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
    <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-600">
      <Icon className="size-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

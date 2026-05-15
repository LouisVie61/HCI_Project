import { useState, FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../../hooks';
import { validators } from '../../utils';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const { signup, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!validators.email(email)) {
      setValidationError('Email không hợp lệ');
      return;
    }

    if (!validators.password(password)) {
      setValidationError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Mật khẩu không khớp');
      return;
    }

    const success = await signup(email, password);
    if (success) {
      setIsSuccess(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      window.setTimeout(() => {
        onSwitchToLogin?.();
      }, 1800);
    }
  };

  const displayError = validationError || error;

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
          <CheckCircle2 className="size-7" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-950">Đăng ký thành công</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Tài khoản của bạn đã được tạo. Hệ thống sẽ chuyển bạn về màn hình đăng nhập.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-5 text-sm font-semibold text-emerald-900 transition hover:text-slate-950"
        >
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>

      <div>
        <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-slate-700">
          Mật khẩu
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            disabled={loading}
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            disabled={loading}
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>

      {displayError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
      </button>
    </form>
  );
};

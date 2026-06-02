import { useEffect, useRef, useState, FormEvent } from 'react';
import { AlertCircle, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../../hooks';
import { validators } from '../../utils';

interface LoginFormProps {
  onSuccess?: () => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_BUTTON_LOCALE = 'en-US';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client?hl=en';

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login, googleAuth, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response.credential) {
            setValidationError('Could not read Google account information.');
            return;
          }

          const success = await googleAuth(response.credential);
          if (success) {
            onSuccess?.();
          }
        },
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'pill',
          locale: GOOGLE_BUTTON_LOCALE,
        });
      }

      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, [googleAuth, onSuccess]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!validators.email(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!validators.isNotEmpty(password)) {
      setValidationError('Please enter your password.');
      return;
    }

    const success = await login(email, password);
    if (success) {
      setEmail('');
      setPassword('');
      onSuccess?.();
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
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
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
        {loading ? 'Logging in...' : 'Log in'}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div className={loading || !googleReady ? 'pointer-events-none opacity-60' : ''}>
          <div ref={googleButtonRef} className="flex min-h-[44px] justify-center" />
        </div>
      ) : (
        <p className="text-center text-xs leading-5 text-slate-500">
          Configure VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID to enable Google sign in.
        </p>
      )}
    </form>
  );
};

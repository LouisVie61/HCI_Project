import { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks';
import { validators } from '../../utils';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate inputs
    if (!validators.email(email)) {
      setValidationError('Email không hợp lệ');
      return;
    }

    if (!validators.password(password)) {
      setValidationError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    // Attempt login
    const success = await login(email, password);
    if (success) {
      setEmail('');
      setPassword('');
      onSuccess?.();
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      {displayError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {displayError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
};

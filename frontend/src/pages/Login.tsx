import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';

export const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤟 Sign Language
          </h1>
          <p className="text-gray-600">
            Hỗ trợ người khiếm thính học ngôn ngữ ký hiệu
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {isSignup ? 'Đăng Ký' : 'Đăng Nhập'}
          </h2>

          {isSignup ? (
            <SignupForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setIsSignup(false)}
            />
          ) : (
            <LoginForm onSuccess={handleAuthSuccess} />
          )}
        </div>

        {/* Switch Mode */}
        {!isSignup && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => setIsSignup(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        )}

        {/* Info Box */}
        {!isSignup && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-semibold mb-2">Demo: Thử đăng ký</p>
            <p>1. Nhấn "Đăng ký ngay"</p>
            <p>2. Nhập email & mật khẩu (6+ ký tự)</p>
            <p>3. Tài khoản sẽ được tạo trong database</p>
          </div>
        )}
      </div>
    </div>
  );
};


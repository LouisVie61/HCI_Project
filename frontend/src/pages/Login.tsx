import { useState } from 'react';
import { ArrowRight, BadgeCheck, BookOpenCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';

const highlights = [
  'Dịch song song giữa ngôn ngữ ký hiệu và văn bản',
  'Học ngôn ngữ ký hiệu qua bài học trực quan',
  'Luyện tập với phản hồi nhanh và dễ hiểu',
  'Theo dõi tiến độ học tập trong dashboard',
];

export const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f3] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden items-stretch bg-slate-950 p-8 text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.28),transparent_32%),radial-gradient(circle_at_78%_12%,rgba(14,165,233,0.26),transparent_30%),linear-gradient(135deg,#07111f_0%,#122033_52%,#182926_100%)]" />
          <div className="absolute inset-x-8 bottom-8 top-8 rounded-[28px] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30" />

          <div className="relative z-10 flex w-full flex-col justify-between rounded-[28px] p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg">
                <BookOpenCheck className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  Sign Language
                </p>
                <p className="text-sm text-white/62">Learning companion</p>
              </div>
            </div>

            <div className="max-w-2xl">
              <h1 className="max-w-xl text-5xl font-semibold leading-[1.04] text-white">
                Bắt đầu hành trình học ngôn ngữ ký hiệu của riêng bạn.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-200/78">
                Một không gian học tập gọn gàng, hiện đại và tập trung cho người học luyện kỹ năng mỗi ngày.
              </p>
            </div>

            <div className="grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur"
                >
                  <BadgeCheck className="size-5 text-emerald-300" />
                  <span className="text-sm text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 lg:hidden">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-300">
                <BookOpenCheck className="size-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Sign Language
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                Học ngôn ngữ ký hiệu dễ hơn mỗi ngày.
              </h1>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/86 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-7">
              <div className="mb-7 flex rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setIsSignup(false)}
                  className={`h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                    !isSignup
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignup(true)}
                  className={`h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                    isSignup
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-emerald-700">
                  {isSignup ? 'Tạo tài khoản mới' : 'Chào mừng trở lại'}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {isSignup ? 'Bắt đầu học ngay hôm nay' : 'Tiếp tục bài học của bạn'}
                </h2>
              </div>

              {isSignup ? (
                <SignupForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setIsSignup(false)}
                />
              ) : (
                <LoginForm onSuccess={handleAuthSuccess} />
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSignup((value) => !value)}
              className="mx-auto mt-6 flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              {isSignup ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

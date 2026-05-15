import { BookOpenCheck, LogOut, Sparkles, UserCircle } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { dashboardNavItems } from './dashboardNav';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeItem =
    [...dashboardNavItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) ||
    dashboardNavItems[0];

  const userName = user?.email?.split('@')[0] || 'bạn';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="min-h-screen bg-[#f6f7f1] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white/90 px-4 py-5 shadow-sm backdrop-blur xl:flex xl:flex-col">
          <BrandBlock />

          <nav className="mt-8 space-y-1">
            {dashboardNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }`
                  }
                >
                  <Icon className="size-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-950">Học đều mỗi ngày</p>
                <p className="text-xs text-emerald-800">Hoàn thành một mục nhỏ là đủ tốt.</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col xl:pl-72">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f6f7f1]/85 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-700">{activeItem.label}</p>
                <h1 className="truncate text-2xl font-semibold text-slate-950">Xin chào, {userName}</h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <UserCircle className="size-5" />
                  </div>
                  <div className="max-w-44">
                    <p className="truncate text-sm font-semibold text-slate-900">{user?.email}</p>
                    <p className="text-xs text-slate-500">Learner</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </div>

            <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8 xl:hidden">
              {dashboardNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    className={({ isActive }) =>
                      `inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                        isActive ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'
                      }`
                    }
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
};

const BrandBlock = () => (
  <div className="flex items-center gap-3 px-2">
    <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
      <BookOpenCheck className="size-6" />
    </div>
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Sign</p>
      <p className="text-lg font-semibold text-slate-950">Language</p>
    </div>
  </div>
);

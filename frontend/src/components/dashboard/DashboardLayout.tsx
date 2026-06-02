import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Sparkles, Sun, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../api/client';
import { useAuth, useTheme } from '../../hooks';
import { dashboardNavItems } from './dashboardNav';

const getAvatarSrc = (avatarUrl?: string | null) => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE_URL}${avatarUrl}`;
};

const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed';
const BRAND_LOGO_SRC = '/SignBridge.png';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');

  const activeItem =
    [...dashboardNavItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) ||
    dashboardNavItems[0];

  const displayName = user?.full_name?.trim() || 'there';
  const avatarSrc = getAvatarSrc(user?.avatar_url);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <main className="min-h-screen bg-[#f6f7f1] text-slate-950">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white/90 px-4 py-5 shadow-sm backdrop-blur transition-[width] duration-200 xl:flex xl:flex-col ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          <BrandBlock isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((current) => !current)} />

          <nav className="mt-8 space-y-1">
            {dashboardNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex h-12 w-full items-center rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    } ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'}`
                  }
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="size-5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {!isSidebarCollapsed && <div className="mt-auto rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-950">Practice every day</p>
                <p className="text-xs text-emerald-800">One small task is enough to keep momentum.</p>
              </div>
            </div>
          </div>}
        </aside>

        <div className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-200 ${isSidebarCollapsed ? 'xl:pl-20' : 'xl:pl-72'}`}>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f6f7f1]/85 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-700">{activeItem.label}</p>
                <h1 className="truncate text-2xl font-semibold text-slate-950">Hello, {displayName}</h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to night mode'}
                  title={isDarkMode ? 'Light mode' : 'Night mode'}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  <span className="hidden lg:inline">{isDarkMode ? 'Light' : 'Night'}</span>
                </button>
                <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex">
                  <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-white">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle className="size-5" />
                    )}
                  </div>
                  <div className="max-w-44">
                    <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Log out</span>
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

const BrandBlock = ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) => (
  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3 px-2'}`}>
    <div className={`flex min-w-0 items-center gap-3 ${isCollapsed ? 'hidden' : ''}`}>
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-slate-900/10">
        <img src={BRAND_LOGO_SRC} alt="SignBridge" className="h-full w-full object-contain" />
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-950">SignBridge</p>
      </div>
    </div>
    {isCollapsed && (
      <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-slate-900/10">
        <img src={BRAND_LOGO_SRC} alt="SignBridge" className="h-full w-full object-contain" />
      </div>
    )}
    <button
      type="button"
      onClick={onToggle}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={`inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 ${
        isCollapsed ? 'absolute left-14 top-6 shadow-sm' : ''
      }`}
    >
      {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
    </button>
  </div>
);

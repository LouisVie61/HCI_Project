import { CheckCircle2, LogOut, Mail, UserCircle, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PanelShell } from '../components/dashboard/DashboardShell';
import { formatDate } from '../components/dashboard/dashboardUtils';
import { useAuth } from '../hooks';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <PanelShell
      eyebrow="Account"
      title="Hồ sơ cá nhân"
      description="Thông tin tài khoản đang đăng nhập trong bản demo."
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-slate-950 text-white">
            <UserCircle className="size-11" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-slate-950">{user?.email?.split('@')[0] || 'Learner'}</h3>
          <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Thông tin tài khoản</h3>
          <div className="mt-5 grid gap-3">
            <InfoRow icon={Mail} label="Email" value={user?.email || 'Chưa có'} />
            <InfoRow icon={UserCircle} label="Vai trò" value={user?.role || 'user'} />
            <InfoRow icon={CheckCircle2} label="Ngày tạo" value={formatDate(user?.created_at)} />
          </div>
        </section>
      </div>
    </PanelShell>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
    <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-600">
      <Icon className="size-5" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

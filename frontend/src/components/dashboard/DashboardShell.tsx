import { RefreshCw, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PanelShellProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export const PanelShell = ({ eyebrow, title, description, action, children }: PanelShellProps) => (
  <section>
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const LoadingState = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
    <RefreshCw className="size-4 animate-spin text-emerald-600" />
    {label}
  </div>
);

export const NoticeState = ({
  tone,
  title,
  message,
}: {
  tone: 'danger' | 'neutral';
  title: string;
  message: string;
}) => {
  const styles =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className={`rounded-2xl border px-4 py-3 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{message}</p>
    </div>
  );
};

export const StatTile = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
      <Icon className="size-5" />
    </div>
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-semibold text-slate-950">{value}</p>
  </div>
);

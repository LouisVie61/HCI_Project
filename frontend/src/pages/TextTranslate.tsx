import { FormEvent } from 'react';
import { Languages, RefreshCw } from 'lucide-react';
import { NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { useTextToSign } from '../hooks';
import { SignGesture } from '../types';

export const TextTranslate = () => {
  const { text, setText, gestures, loading, error, translate } = useTextToSign();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    translate();
  };

  return (
    <PanelShell
      eyebrow="Translator"
      title="Dịch text thành ký hiệu"
      description="Nhập câu ngắn để xem chuỗi ký hiệu tương ứng từ backend."
    >
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="translate-text" className="text-sm font-semibold text-slate-700">
            Nội dung cần dịch
          </label>
          <textarea
            id="translate-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ví dụ: Xin chào, hôm nay bạn khỏe không?"
            className="mt-3 min-h-44 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          />
          {error && (
            <div className="mt-4">
              <NoticeState tone="danger" title="Không dịch được" message={error} />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <Languages className="size-4" />}
            {loading ? 'Đang dịch...' : 'Dịch sang ký hiệu'}
          </button>
        </form>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Chuỗi ký hiệu</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {gestures.length} mục
            </span>
          </div>
          {gestures.length === 0 ? (
            <NoticeState
              tone="neutral"
              title="Chưa có bản dịch"
              message="Sau khi nhập nội dung và nhấn dịch, các ký hiệu sẽ xuất hiện tại đây."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(gestures as SignGesture[]).map((gesture, index) => (
                <div key={`${gesture.id}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ký hiệu {index + 1}</p>
                  <h4 className="mt-2 text-base font-semibold text-slate-950">{gesture.name || gesture.id}</h4>
                  <p className="mt-2 text-sm text-slate-500">{gesture.keypoints?.length || 0} keypoints</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
};

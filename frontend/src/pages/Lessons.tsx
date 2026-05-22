import { Play, RefreshCw, Search } from 'lucide-react';
import { LoadingState, NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { formatDate } from '../components/dashboard/dashboardUtils';
import { useLessons } from '../hooks';

export const Lessons = () => {
  const { lessons, loading, error, search, setSearch, filter, setFilter, refetch } = useLessons();

  return (
    <PanelShell
      eyebrow="Learning"
      title="Bài học ngôn ngữ ký hiệu"
      description="Tìm kiếm bài học, lọc theo nhóm nội dung và mở nhanh phần cần luyện."
      action={
        <button
          type="button"
          onClick={refetch}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="size-4" />
          Tải lại
        </button>
      }
    >
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm bài học..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        >
          <option value="">Tất cả chủ đề</option>
          <option value="alphabet">Bảng chữ cái</option>
          <option value="daily">Giao tiếp hằng ngày</option>
          <option value="number">Số đếm</option>
        </select>
      </div>

      {loading && <LoadingState label="Đang tải danh sách bài học..." />}
      {error && <NoticeState tone="danger" title="Không tải được bài học" message={error} />}
      {!loading && !error && lessons.length === 0 && (
        <NoticeState tone="neutral" title="Chưa có bài học" message="Khi backend trả dữ liệu, các bài học sẽ xuất hiện tại đây." />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {lessons.map((lesson, index) => (
          <article key={lesson.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Bài {index + 1}
              </span>
              <span className="text-xs text-slate-400">{formatDate(lesson.created_at)}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-950">{lesson.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{lesson.content}</p>
            {lesson.video_url && (
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Play className="size-4" />
                Xem video
              </a>
            )}
          </article>
        ))}
      </div>
    </PanelShell>
  );
};

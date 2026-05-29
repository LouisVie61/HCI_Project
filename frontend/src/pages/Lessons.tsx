import { useNavigate } from 'react-router-dom';
import { Play, RefreshCw, Search } from 'lucide-react';
import { LoadingState, NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { formatDate } from '../components/dashboard/dashboardUtils';
import { useLessons } from '../hooks';

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

export const Lessons = () => {
  const navigate = useNavigate();
  const {
    lessons,
    loading,
    error,
    progressLoading,
    progressError,
    progressByLessonId,
    search,
    setSearch,
    difficulty,
    setDifficulty,
    learningStatus,
    setLearningStatus,
    refetch,
  } = useLessons();

  return (
    <PanelShell
      eyebrow="Learning"
      title="Sign Language Lessons"
      description="Search lessons, filter by difficulty, and open the lesson you want to practice."
      action={
        <button
          type="button"
          onClick={refetch}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      }
    >
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_190px_190px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search lessons..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        >
          <option value="">All difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          value={learningStatus}
          onChange={(event) => setLearningStatus(event.target.value)}
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        >
          <option value="">All progress</option>
          <option value="learned">Started</option>
          <option value="unlearned">Not started</option>
        </select>
      </div>

      {loading && <LoadingState label="Loading lessons..." />}
      {error && <NoticeState tone="danger" title="Could not load lessons" message={error} />}
      {progressError && <NoticeState tone="danger" title="Could not load progress" message={progressError} />}
      {!loading && !error && lessons.length === 0 && (
        <NoticeState tone="neutral" title="No matching lessons" message="Try changing the keyword, difficulty, or learning status." />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {lessons.map((lesson, index) => {
          const progressPercent = Math.round(progressByLessonId[lesson.id]?.progress_percent || 0);
          const progressLabel =
            progressPercent >= 100 ? 'Completed' : progressPercent > 0 ? 'In progress' : 'Not started';

          return (
            <article key={lesson.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Lesson {index + 1}
                </span>
                <span className="text-xs text-slate-400">{formatDate(lesson.created_at)}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-950">{lesson.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                {lesson.description || 'Sign language lesson.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {difficultyLabels[lesson.difficulty]}
                </p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {progressLoading ? 'Loading progress...' : `${progressLabel} · ${progressPercent}%`}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {lesson.content && (
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Play className="size-4" />
                  Watch video
                </button>
              )}
            </article>
          );
        })}
      </div>
    </PanelShell>
  );
};

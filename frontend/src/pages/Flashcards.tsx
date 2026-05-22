import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Trophy } from 'lucide-react';
import { LoadingState, NoticeState, PanelShell, StatTile } from '../components/dashboard/DashboardShell';
import { useFlashcards } from '../hooks';

export const Flashcards = () => {
  const {
    cards,
    currentCard,
    currentIndex,
    score,
    userScore,
    loading,
    error,
    nextCard,
    prevCard,
    recordAnswer,
    submitScore,
    refetch,
  } = useFlashcards(10);

  const progress = cards.length ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  return (
    <PanelShell
      eyebrow="Practice"
      title="Flashcard luyện nhớ"
      description="Lật từng thẻ, tự đánh giá câu trả lời và lưu điểm sau lượt luyện."
      action={
        <button
          type="button"
          onClick={refetch}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="size-4" />
          Bộ thẻ mới
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          {loading && <LoadingState label="Đang chuẩn bị flashcard..." />}
          {error && <NoticeState tone="danger" title="Không tải được flashcard" message={error} />}
          {!loading && !error && !currentCard && (
            <NoticeState tone="neutral" title="Chưa có flashcard" message="Backend chưa trả dữ liệu thẻ luyện tập." />
          )}
          {currentCard && (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Thẻ {currentIndex + 1}/{cards.length}
                </span>
                <span className="text-sm font-semibold text-emerald-700">{progress}%</span>
              </div>
              <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-slate-950 p-8 text-center text-white">
                <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">Từ cần luyện</p>
                <h3 className="text-4xl font-semibold">{currentCard.word}</h3>
                <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
                  Quan sát dữ liệu ký hiệu hoặc tự thực hiện ký hiệu, sau đó đánh dấu kết quả của bạn.
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Dữ liệu ký hiệu</p>
                <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-xs text-slate-500">
                  {JSON.stringify(currentCard.sign_data, null, 2)}
                </pre>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => recordAnswer(false)}
                  className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Chưa nhớ
                </button>
                <button
                  type="button"
                  onClick={() => recordAnswer(true)}
                  className="h-12 rounded-2xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Đã nhớ
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft className="size-4" />
                  Trước
                </button>
                {currentIndex === cards.length - 1 ? (
                  <button
                    type="button"
                    onClick={submitScore}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="size-4" />
                    Lưu điểm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextCard}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Tiếp
                    <ChevronRight className="size-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        <aside className="grid content-start gap-4">
          <StatTile label="Điểm lượt này" value={String(score)} icon={Trophy} />
          <StatTile label="Tổng điểm" value={String(userScore?.total_score || 0)} icon={CheckCircle2} />
          <StatTile label="Số lượt luyện" value={String(userScore?.attempts || 0)} icon={RefreshCw} />
        </aside>
      </div>
    </PanelShell>
  );
};

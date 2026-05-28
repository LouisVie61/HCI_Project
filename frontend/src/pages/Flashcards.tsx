import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, ExternalLink, RefreshCw, Trophy, XCircle } from 'lucide-react';
import { LoadingState, NoticeState, PanelShell, StatTile } from '../components/dashboard/DashboardShell';
import { useFlashcards } from '../hooks';
import type { Flashcard } from '../types';

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const getSignData = (card: Flashcard | null | undefined) => {
  const signData = card?.sign_data;
  if (!signData || typeof signData !== 'object') {
    return {};
  }

  return signData as Record<string, unknown>;
};

const getMediaUrl = (card: Flashcard | null | undefined) => {
  const signData = getSignData(card);

  return String(
    signData.mp4_url ||
      signData.video_mp4 ||
      signData.video_src ||
      signData.media_url ||
      signData.src ||
      signData.video_url ||
      ''
  );
};

const isVideoFile = (url: string) => {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
};

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
    recordAnswer,
    submitScore,
    refetch,
  } = useFlashcards(10);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);

  const progress = cards.length ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;
  const mediaUrl = getMediaUrl(currentCard);
  const sourceUrl = String(getSignData(currentCard).source_url || (!isVideoFile(mediaUrl) ? mediaUrl : ''));
  const isCorrect = Boolean(currentCard && selectedAnswer === currentCard.word);

  const answerOptions = useMemo(() => {
    if (!currentCard) {
      return [];
    }

    const customOptions = getSignData(currentCard).options;
    if (Array.isArray(customOptions) && customOptions.length >= 4) {
      return shuffle(customOptions.slice(0, 4).map(String));
    }

    const wrongAnswers = shuffle(cards.filter((card) => card.id !== currentCard.id))
      .slice(0, 3)
      .map((card) => card.word);

    return shuffle([currentCard.word, ...wrongAnswers]).slice(0, 4);
  }, [cards, currentCard]);

  useEffect(() => {
    setSelectedAnswer('');
    setHasAnswered(false);
  }, [currentCard?.id]);

  const handleAnswer = (answer: string) => {
    if (!currentCard || hasAnswered) {
      return;
    }

    setSelectedAnswer(answer);
    setHasAnswered(true);
    void recordAnswer(answer === currentCard.word);
  };

  const handleNext = () => {
    if (currentIndex === cards.length - 1) {
      void submitScore();
      return;
    }

    nextCard();
  };

  return (
    <PanelShell
      eyebrow="Flashcard"
      title="Đoán ký hiệu qua video"
      description="Xem video ký hiệu, chọn 1 trong 4 đáp án và lưu điểm sau lượt luyện."
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

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
                {mediaUrl && isVideoFile(mediaUrl) ? (
                  <video
                    key={mediaUrl}
                    src={mediaUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-video w-full bg-slate-950 object-contain"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-300">
                    Flashcard này chưa có file video MP4.
                  </div>
                )}
              </div>

              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Mở nguồn video
                  <ExternalLink className="size-4" />
                </a>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {answerOptions.map((answer) => {
                  const isSelected = selectedAnswer === answer;
                  const isRightAnswer = currentCard.word === answer;
                  const showCorrect = hasAnswered && isRightAnswer;
                  const showWrong = hasAnswered && isSelected && !isRightAnswer;

                  return (
                    <button
                      key={answer}
                      type="button"
                      onClick={() => handleAnswer(answer)}
                      disabled={hasAnswered}
                      className={`flex min-h-16 items-center justify-between rounded-2xl border px-5 py-4 text-left text-base font-semibold shadow-sm transition ${
                        showCorrect
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                          : showWrong
                            ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-100'
                            : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-200 hover:bg-emerald-50 disabled:hover:border-slate-200 disabled:hover:bg-white'
                      }`}
                    >
                      <span>{answer}</span>
                      {showCorrect && <CheckCircle2 className="size-5" />}
                      {showWrong && <XCircle className="size-5" />}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div
                  className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                    isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {isCorrect ? 'Chính xác!' : `Chưa đúng. Đáp án là: ${currentCard.word}`}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasAnswered}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {currentIndex === cards.length - 1 ? 'Lưu điểm' : 'Tiếp'}
                  <ChevronRight className="size-4" />
                </button>
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

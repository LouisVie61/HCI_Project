import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { lessonApi } from '../api/endpoints';
import { LoadingState, NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { useLesson } from '../hooks';

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubePlayerReadyEvent = {
  target: YouTubePlayer;
};

type YouTubePlayerStateEvent = {
  data: number;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: (event: YouTubePlayerReadyEvent) => void;
        onStateChange?: (event: YouTubePlayerStateEvent) => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
  };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const difficultyLabels = {
  beginner: 'Cơ bản',
  intermediate: 'Trung bình',
  advanced: 'Nâng cao',
} as const;

const loadYouTubeIframeApi = () =>
  new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });

const getYouTubeVideoId = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    let videoId = '';

    if (parsedUrl.hostname.includes('youtu.be')) {
      videoId = parsedUrl.pathname.slice(1);
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.split('/embed/')[1] || '';
      } else if (parsedUrl.pathname.startsWith('/shorts/')) {
        videoId = parsedUrl.pathname.split('/shorts/')[1] || '';
      } else {
        videoId = parsedUrl.searchParams.get('v') || '';
      }
    }

    const cleanVideoId = videoId.split(/[/?&]/)[0];
    return cleanVideoId || null;
  } catch {
    return null;
  }
};

export const LessonPlayer = () => {
  const navigate = useNavigate();
  const { lessonId = '' } = useParams();
  const { lesson, loading, error } = useLesson(lessonId);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const lastSavedProgressRef = useRef(0);
  const resumeProgressRef = useRef(0);

  const videoId = lesson ? getYouTubeVideoId(lesson.content) : null;

  const goBackToList = () => {
    navigate('/dashboard/lessons');
  };

  const saveLessonProgress = useCallback(async (nextProgress: number) => {
    if (!lessonId) {
      return;
    }

    setSavingProgress(true);
    setProgressError(null);

    const result = await lessonApi.updateProgress(lessonId, nextProgress);
    if (result.error) {
      setProgressError(result.error);
    } else {
      const savedProgress = result.data?.progress_percent ?? nextProgress;
      setProgressPercent(savedProgress);
      lastSavedProgressRef.current = savedProgress;
    }

    setSavingProgress(false);
  }, [lessonId]);

  const readPlayerProgress = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return null;
    }

    const duration = player.getDuration();
    if (!duration || duration <= 0) {
      return null;
    }

    const currentTime = player.getCurrentTime();
    if (currentTime <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(1, Math.round((currentTime / duration) * 100)));
  }, []);

  const syncPlayerProgress = useCallback(async () => {
    const nextProgress = readPlayerProgress();
    if (nextProgress === null) {
      return;
    }

    if (nextProgress <= lastSavedProgressRef.current) {
      setProgressPercent((current) => Math.max(current ?? 0, nextProgress));
      return;
    }

    await saveLessonProgress(nextProgress);
  }, [readPlayerProgress, saveLessonProgress]);

  const seekToSavedProgress = useCallback((player: YouTubePlayer) => {
    const savedProgress = resumeProgressRef.current;
    if (savedProgress <= 0 || savedProgress >= 100) {
      return;
    }

    const duration = player.getDuration();
    if (!duration || duration <= 0) {
      window.setTimeout(() => seekToSavedProgress(player), 500);
      return;
    }

    const resumeSecond = Math.floor((duration * savedProgress) / 100);
    if (resumeSecond > 0) {
      player.seekTo(resumeSecond, true);
    }
  }, []);

  const restartLesson = async () => {
    if (!lessonId) {
      return;
    }

    setSavingProgress(true);
    setProgressError(null);

    const result = await lessonApi.restart(lessonId);
    if (result.error) {
      setProgressError(result.error);
    } else {
      const resetProgress = result.data?.progress_percent ?? 0;
      setProgressPercent(resetProgress);
      lastSavedProgressRef.current = resetProgress;
      resumeProgressRef.current = resetProgress;
      playerRef.current?.seekTo(0, true);
    }

    setSavingProgress(false);
  };

  useEffect(() => {
    if (!lesson?.id) {
      return;
    }

    let isCancelled = false;
    setProgressLoaded(false);
    setProgressPercent(null);
    setProgressError(null);
    lastSavedProgressRef.current = 0;
    resumeProgressRef.current = 0;

    void lessonApi.start(lesson.id).then((result) => {
      if (isCancelled) {
        return;
      }

      if (result.error) {
        setProgressError(result.error);
      } else {
        const currentProgress = result.data?.progress_percent ?? 0;
        setProgressPercent(currentProgress);
        lastSavedProgressRef.current = currentProgress;
        resumeProgressRef.current = currentProgress;
      }

      setProgressLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [lesson?.id]);

  useEffect(() => {
    if (!lesson || !videoId || !progressLoaded || !playerHostRef.current) {
      return;
    }

    let isDisposed = false;

    void loadYouTubeIframeApi().then(() => {
      if (isDisposed || !window.YT?.Player || !playerHostRef.current) {
        return;
      }

      playerHostRef.current.innerHTML = '';
      playerRef.current = new window.YT.Player(playerHostRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            seekToSavedProgress(event.target);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.ENDED) {
              void saveLessonProgress(100);
            }
          },
        },
      });

      progressTimerRef.current = window.setInterval(() => {
        void syncPlayerProgress();
      }, 2000);
    });

    return () => {
      isDisposed = true;
      void syncPlayerProgress();

      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [lesson, progressLoaded, saveLessonProgress, seekToSavedProgress, syncPlayerProgress, videoId]);

  return (
    <PanelShell
      eyebrow="Learning"
      title={lesson?.title || 'Đang học'}
      description={lesson?.description || 'Theo dõi video bài học và lưu tiến độ tự động.'}
      action={
        <button
          type="button"
          onClick={goBackToList}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </button>
      }
    >
      {loading && <LoadingState label="Đang tải bài học..." />}
      {error && <NoticeState tone="danger" title="Không tải được bài học" message={error} />}
      {!loading && !error && !lesson && (
        <NoticeState tone="neutral" title="Không tìm thấy bài học" message="Bài học không tồn tại hoặc chưa được mở." />
      )}

      {lesson && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {difficultyLabels[lesson.difficulty]}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void restartLesson()}
                disabled={savingProgress}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="size-4" />
                Học lại từ đầu
              </button>
              <button
                type="button"
                onClick={() => void saveLessonProgress(100)}
                disabled={savingProgress}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="size-4" />
                Đánh dấu hoàn thành
              </button>
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-emerald-700">Tiến độ: {progressPercent ?? 0}%</span>
              {savingProgress && <span className="text-sm font-medium text-slate-500">Đang lưu tiến độ...</span>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progressPercent ?? 0}%` }}
              />
            </div>
            {progressError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                Không ghi được tiến độ: {progressError}
              </p>
            )}
          </div>

          {videoId ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950">
              <div ref={playerHostRef} className="absolute inset-0 h-full w-full" />
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl bg-slate-100 p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Link video không đúng định dạng YouTube.</p>
            </div>
          )}
        </section>
      )}
    </PanelShell>
  );
};

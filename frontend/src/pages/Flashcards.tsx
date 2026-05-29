import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, ExternalLink, RefreshCw, Trophy, XCircle } from 'lucide-react';
import { flashcardApi } from '../api/endpoints';
import { LoadingState, NoticeState, PanelShell, StatTile } from '../components/dashboard/DashboardShell';
import { useFlashcards } from '../hooks';
import type { Flashcard } from '../types';

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyOptions: Array<{ value: Difficulty; label: string; description: string }> = [
  { value: 'easy', label: 'Easy', description: 'Core signs and short answer sets' },
  { value: 'medium', label: 'Medium', description: 'ASL video embeds and mixed signs' },
  { value: 'hard', label: 'Hard', description: 'Less common signs and close distractors' },
];

const createSignAslCard = (word: string, vidref: string, difficulty: Difficulty, options: string[]): Flashcard => ({
  id: `signasl-${word}-${difficulty}`,
  word,
  sign_data: {
    difficulty,
    embed_provider: 'signasl',
    signasl_ref: vidref,
    source_url: `https://www.signasl.org/sign/${word}`,
    options,
  },
});

const easySignAslCards: Flashcard[] = [
  createSignAslCard('baby', 'ddnhl4pfst', 'easy', ['baby', 'cabin', 'dance', 'face']),
  createSignAslCard('cabin', '9kehzpinhq', 'easy', ['cabin', 'baby', 'key', 'game']),
  createSignAslCard('dance', 'f6az5eoa6c', 'easy', ['dance', 'face', 'hair', 'ice']),
  createSignAslCard('ear', 'himextn3ot', 'easy', ['ear', 'face', 'hair', 'key']),
  createSignAslCard('face', 'hsjoa8fdnn', 'easy', ['face', 'ear', 'baby', 'dance']),
  createSignAslCard('game', 'gk0ip6kiga', 'easy', ['game', 'cabin', 'jean', 'key']),
  createSignAslCard('hair', '8tyzt5jve8', 'easy', ['hair', 'ear', 'ice', 'face']),
  createSignAslCard('ice', 'xlfo0ujipf', 'easy', ['ice', 'hair', 'dance', 'baby']),
  createSignAslCard('jean', 'nufr9tqwou', 'easy', ['jean', 'game', 'cabin', 'key']),
  createSignAslCard('key', 'nxyla3fbkw', 'easy', ['key', 'cabin', 'game', 'ear']),
];
const easySignAslCardIds = new Set(easySignAslCards.map((card) => card.id));

const signAslDemoCard: Flashcard = {
  id: 'signasl-abductor-medium',
  word: 'abductor',
  sign_data: {
    difficulty: 'medium',
    embed_provider: 'signasl',
    signasl_ref: 'lannrmx1ej',
    source_url: 'https://www.signasl.org/sign/abductor',
    options: ['abductor', 'adapter', 'actor', 'doctor'],
  },
};

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

const getDifficulty = (card: Flashcard): Difficulty | null => {
  const signData = getSignData(card);
  const rawDifficulty = String(signData.difficulty || signData.level || '').toLowerCase();

  if (['easy', 'beginner', 'basic'].includes(rawDifficulty)) {
    return 'easy';
  }

  if (['medium', 'intermediate'].includes(rawDifficulty)) {
    return 'medium';
  }

  if (['hard', 'advanced', 'difficult'].includes(rawDifficulty)) {
    return 'hard';
  }

  return null;
};

const SignAslVideo = ({ vidref }: { vidref: string }) => {
  const [videoSrc, setVideoSrc] = useState('');
  const [posterSrc, setPosterSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`https://embed-api.signasl.org/widgethtml/${vidref}?wordhint=`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const video = doc.querySelector('video');
        const source = video?.querySelector('source');

        if (isMounted) {
          setVideoSrc(source?.getAttribute('src') || '');
          setPosterSrc(video?.getAttribute('poster') || '');
        }
      } catch {
        if (isMounted) {
          setVideoSrc('');
          setPosterSrc('');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadVideo();

    return () => {
      isMounted = false;
    };
  }, [vidref]);

  if (isLoading) {
    return <div className="flex aspect-video w-full items-center justify-center text-sm font-semibold text-slate-300">Loading ASL video...</div>;
  }

  if (!videoSrc) {
    return <div className="flex aspect-video w-full items-center justify-center text-sm font-semibold text-slate-300">Could not load this ASL video.</div>;
  }

  return (
    <video
      key={videoSrc}
      src={videoSrc}
      poster={posterSrc}
      controls
      muted
      loop
      playsInline
      className="aspect-video w-full bg-slate-950 object-contain"
    />
  );
};

export const Flashcards = () => {
  const { cards, userScore, loading, error, refetch } = useFlashcards(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);

  const practiceCards = useMemo(() => {
    const cardsByDifficulty = cards.filter((card) => getDifficulty(card) === selectedDifficulty);

    if (selectedDifficulty === 'easy') {
      return [...easySignAslCards, ...cardsByDifficulty.filter((card) => !easySignAslCardIds.has(card.id))];
    }

    if (selectedDifficulty === 'medium') {
      return [signAslDemoCard, ...cardsByDifficulty.filter((card) => card.id !== signAslDemoCard.id)];
    }

    return cardsByDifficulty;
  }, [cards, selectedDifficulty]);

  const currentCard = practiceCards[currentIndex];
  const progress = practiceCards.length ? Math.round(((currentIndex + 1) / practiceCards.length) * 100) : 0;
  const mediaUrl = getMediaUrl(currentCard);
  const currentSignData = getSignData(currentCard);
  const signAslVidref = String(currentSignData.signasl_ref || currentSignData.vidref || '');
  const sourceUrl = String(currentSignData.source_url || (!isVideoFile(mediaUrl) ? mediaUrl : ''));
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

  useEffect(() => {
    setCurrentIndex(0);
    setScore(0);
  }, [selectedDifficulty]);

  useEffect(() => {
    if (currentIndex >= practiceCards.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, practiceCards.length]);

  const handleAnswer = (answer: string) => {
    if (!currentCard || hasAnswered) {
      return;
    }

    setSelectedAnswer(answer);
    setHasAnswered(true);
    if (answer === currentCard.word) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex === practiceCards.length - 1) {
      await flashcardApi.recordScore(score, practiceCards.length);
      setScore(0);
      setCurrentIndex(0);
      refetch();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <PanelShell
      eyebrow="Flashcard"
      title="Guess the ASL sign"
      description="Watch the sign video, choose the correct answer, and save your score at the end of the round."
      action={
        <button
          type="button"
          onClick={refetch}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="size-4" />
          New deck
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {difficultyOptions.map((option) => {
              const isActive = selectedDifficulty === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedDifficulty(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{option.description}</span>
                </button>
              );
            })}
          </div>

          {loading && !currentCard && <LoadingState label="Preparing flashcards..." />}
          {error && !currentCard && <NoticeState tone="danger" title="Could not load flashcards" message={error} />}
          {!loading && !error && !currentCard && (
            <NoticeState tone="neutral" title="No cards in this level" message="Add ASL cards with a matching difficulty level to practice here." />
          )}

          {currentCard && (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Card {currentIndex + 1}/{practiceCards.length}
                </span>
                <span className="text-sm font-semibold text-emerald-700">{progress}%</span>
              </div>

              <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
                {signAslVidref ? (
                  <SignAslVideo key={`${currentCard.id}-${signAslVidref}`} vidref={signAslVidref} />
                ) : mediaUrl && isVideoFile(mediaUrl) ? (
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
                    This flashcard does not have a playable ASL video yet.
                  </div>
                )}
              </div>

              {sourceUrl && hasAnswered && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Open video source
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
                  {isCorrect ? 'Correct!' : `Not quite. The answer is: ${currentCard.word}`}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasAnswered}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {currentIndex === practiceCards.length - 1 ? 'Save score' : 'Next'}
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="grid content-start gap-4">
          <StatTile label="Round score" value={String(score)} icon={Trophy} />
          <StatTile label="Total score" value={String(userScore?.total_score || 0)} icon={CheckCircle2} />
          <StatTile label="Practice rounds" value={String(userScore?.attempts || 0)} icon={RefreshCw} />
        </aside>
      </div>
    </PanelShell>
  );
};

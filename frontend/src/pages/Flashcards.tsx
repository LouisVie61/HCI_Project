import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clock, ExternalLink, Layers, RefreshCw, Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { flashcardApi } from '../api/endpoints';
import { LoadingState, NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { useAuth, useFlashcards } from '../hooks';
import type { Flashcard } from '../types';

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

type Difficulty = 'easy' | 'medium' | 'hard';
type TopicId = 'daily-life' | 'people-body' | 'school-work' | 'places-actions';

type TopicProgress = Record<
  string,
  {
    seenCardIds: string[];
    correctCardIds: string[];
    bestScore: number;
    attempts: number;
  }
>;

type LeaderboardEntry = {
  id: string;
  userId: string;
  userName: string;
  topicId: TopicId;
  topicLabel: string;
  difficulty: Difficulty;
  score: number;
  correct: number;
  total: number;
  createdAt: string;
};

const FLASHCARD_PROGRESS_KEY = 'asl-flashcard-topic-progress-v1';
const FLASHCARD_LEADERBOARD_KEY = 'asl-flashcard-timer-leaderboard-v1';
const CARD_TIME_LIMIT_SECONDS = 15;

const difficultyOptions: Array<{ value: Difficulty; label: string; description: string }> = [
  { value: 'easy', label: 'Easy', description: 'Core signs and short answer sets' },
  { value: 'medium', label: 'Medium', description: 'ASL video embeds and mixed signs' },
  { value: 'hard', label: 'Hard', description: 'Less common signs and close distractors' },
];

const topicOptions: Array<{ id: TopicId; label: string; description: string }> = [
  { id: 'daily-life', label: 'Daily Life', description: 'Everyday objects, routines, and quick responses' },
  { id: 'people-body', label: 'People & Body', description: 'Family, identity, body parts, and health roles' },
  { id: 'school-work', label: 'School & Work', description: 'Learning, jobs, tools, and structured tasks' },
  { id: 'places-actions', label: 'Places & Actions', description: 'Locations, movement, sports, and abstract actions' },
];

const wordTopics: Record<string, TopicId> = {
  baby: 'people-body',
  cabin: 'places-actions',
  dance: 'places-actions',
  ear: 'people-body',
  face: 'people-body',
  game: 'places-actions',
  hair: 'people-body',
  ice: 'places-actions',
  jean: 'daily-life',
  key: 'school-work',
  book: 'school-work',
  drink: 'daily-life',
  chair: 'daily-life',
  go: 'places-actions',
  clothes: 'daily-life',
  help: 'daily-life',
  no: 'daily-life',
  walk: 'places-actions',
  yes: 'daily-life',
  mother: 'people-body',
  abductor: 'people-body',
  computer: 'school-work',
  before: 'places-actions',
  cousin: 'people-body',
  deaf: 'people-body',
  finish: 'daily-life',
  many: 'places-actions',
  table: 'daily-life',
  woman: 'people-body',
  family: 'people-body',
  language: 'school-work',
  study: 'school-work',
  accident: 'places-actions',
  change: 'places-actions',
  doctor: 'people-body',
  enjoy: 'daily-life',
  forget: 'daily-life',
  graduate: 'school-work',
  medicine: 'people-body',
  secretary: 'school-work',
  visit: 'places-actions',
  africa: 'places-actions',
  basketball: 'places-actions',
  cheat: 'places-actions',
  decide: 'places-actions',
  inform: 'places-actions',
  headache: 'people-body',
  knife: 'places-actions',
  opposite: 'places-actions',
  government: 'school-work',
  practice: 'daily-life',
  principal: 'people-body',
  restaurant: 'places-actions',
  schedule: 'daily-life',
  sentence: 'school-work',
  subtract: 'school-work',
  technology: 'school-work',
  temperature: 'places-actions',
  volunteer: 'people-body',
  yesterday: 'daily-life',
  library: 'school-work',
};

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

const createWlaslCard = (word: string, videoUrl: string, difficulty: Difficulty): Flashcard => ({
  id: `wlasl-${word}-${difficulty}`,
  word,
  sign_data: {
    difficulty,
    source: 'WLASL',
    video_url: videoUrl,
    source_url: videoUrl,
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

const easyWlaslCards: Flashcard[] = [
  createWlaslCard('book', 'https://signstock.blob.core.windows.net/signschool/videos/SignSchool%20Book.mp4', 'easy'),
  createWlaslCard('drink', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/drink.mp4', 'easy'),
  createWlaslCard('chair', 'https://media.spreadthesign.com/video/mp4/13/74909.mp4', 'easy'),
  createWlaslCard('go', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/go.mp4', 'easy'),
  createWlaslCard('clothes', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/clothes.mp4', 'easy'),
  createWlaslCard('help', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/help.mp4', 'easy'),
  createWlaslCard('no', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/no.mp4', 'easy'),
  createWlaslCard('walk', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/walk.mp4', 'easy'),
  createWlaslCard('yes', 'https://media.asldeafined.com/vocabulary/1468774983.6377.mp4', 'easy'),
  createWlaslCard('mother', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/mother.mp4', 'easy'),
];

const mediumWlaslCards: Flashcard[] = [
  createWlaslCard('computer', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/computer-2.mp4', 'medium'),
  createWlaslCard('before', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Before%202-02xxXtC3G8c.mp4', 'medium'),
  createWlaslCard('cousin', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/cousin-female.mp4', 'medium'),
  createWlaslCard('deaf', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/deaf.mp4', 'medium'),
  createWlaslCard('finish', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/finish.mp4', 'medium'),
  createWlaslCard('many', 'https://media.spreadthesign.com/video/mp4/13/246018.mp4', 'medium'),
  createWlaslCard('table', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Booth%2C%20Desk%2C%20Table-8QbAD7Y9UEk.mp4', 'medium'),
  createWlaslCard('woman', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/woman2.mp4', 'medium'),
  createWlaslCard('family', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/family.mp4', 'medium'),
  createWlaslCard('language', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Language%203-3MX4tSI4zV0.mp4', 'medium'),
  createWlaslCard('study', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Study-Yk94i4N_5Ag.mp4', 'medium'),
  createWlaslCard('accident', 'https://media.spreadthesign.com/video/mp4/13/72311.mp4', 'medium'),
  createWlaslCard('change', 'https://media.spreadthesign.com/video/mp4/13/125921.mp4', 'medium'),
  createWlaslCard('doctor', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/doctor.mp4', 'medium'),
  createWlaslCard('enjoy', 'https://media.asldeafined.com/vocabulary/1468376460.8089.mp4', 'medium'),
  createWlaslCard('forget', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Forget-5pgZiT-vz60.mp4', 'medium'),
  createWlaslCard('graduate', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/graduate.mp4', 'medium'),
  createWlaslCard('medicine', 'https://signstock.blob.core.windows.net/signschool/videos/SignSchool%20Medicine.mp4', 'medium'),
  createWlaslCard('secretary', 'https://media.spreadthesign.com/video/mp4/13/51753.mp4', 'medium'),
  createWlaslCard('visit', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Visit%202-5Dgxt9vLDMQ.mp4', 'medium'),
];

const hardWlaslCards: Flashcard[] = [
  createWlaslCard('africa', 'https://media.spreadthesign.com/video/mp4/13/50049.mp4', 'hard'),
  createWlaslCard('basketball', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/basketball.mp4', 'hard'),
  createWlaslCard('cheat', 'https://media.spreadthesign.com/video/mp4/13/125942.mp4', 'hard'),
  createWlaslCard('decide', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Decide%2C%20Definitely-a6H-G5Vhz6w.mp4', 'hard'),
  createWlaslCard('inform', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Inform%2C%20Let%20You%20Know-Mc2Tt9PNM3Y.mp4', 'hard'),
  createWlaslCard('headache', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Bad%20Headache-_dx7n545hbc.mp4', 'hard'),
  createWlaslCard('knife', 'https://media.spreadthesign.com/video/mp4/13/457473.mp4', 'hard'),
  createWlaslCard('opposite', 'https://media.spreadthesign.com/video/mp4/13/307964.mp4', 'hard'),
  createWlaslCard('government', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Government%202-VsivllxcxiI.mp4', 'hard'),
  createWlaslCard('practice', 'https://media.asldeafined.com/vocabulary/1468755145.5671.mp4', 'hard'),
  createWlaslCard('principal', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Principal%2C%20Phillipines-yVkocSHMILU.mp4', 'hard'),
  createWlaslCard('restaurant', 'https://media.spreadthesign.com/video/mp4/13/50756.mp4', 'hard'),
  createWlaslCard('schedule', 'https://media.spreadthesign.com/video/mp4/13/310888.mp4', 'hard'),
  createWlaslCard('sentence', 'https://s3-us-west-1.amazonaws.com/files.startasl.com/asldictionary/sentence.mp4', 'hard'),
  createWlaslCard('subtract', 'https://media.spreadthesign.com/video/mp4/13/117079.mp4', 'hard'),
  createWlaslCard('technology', 'https://media.spreadthesign.com/video/mp4/13/58387.mp4', 'hard'),
  createWlaslCard('temperature', 'https://media.spreadthesign.com/video/mp4/13/50895.mp4', 'hard'),
  createWlaslCard('volunteer', 'https://media.spreadthesign.com/video/mp4/13/245031.mp4', 'hard'),
  createWlaslCard('yesterday', 'https://signstock.blob.core.windows.net/signschool/videos/db_uploads/SignSchool%20Yesterday-ODfO21WATKY.mp4', 'hard'),
  createWlaslCard('library', 'https://media.spreadthesign.com/video/mp4/13/457535.mp4', 'hard'),
];

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

const curatedCardsByDifficulty: Record<Difficulty, Flashcard[]> = {
  easy: [...easySignAslCards, ...easyWlaslCards],
  medium: [signAslDemoCard, ...mediumWlaslCards],
  hard: hardWlaslCards,
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

const getTopic = (card: Flashcard): TopicId => {
  const signData = getSignData(card);
  const rawTopic = String(signData.topic || signData.category || '').toLowerCase();

  if (topicOptions.some((topic) => topic.id === rawTopic)) {
    return rawTopic as TopicId;
  }

  return wordTopics[card.word.toLowerCase()] || 'daily-life';
};

const getProgressKey = (topicId: TopicId, difficulty: Difficulty) => `${topicId}:${difficulty}`;

const readProgress = (): TopicProgress => {
  try {
    const rawProgress = window.localStorage.getItem(FLASHCARD_PROGRESS_KEY);
    return rawProgress ? (JSON.parse(rawProgress) as TopicProgress) : {};
  } catch {
    return {};
  }
};

const writeProgress = (progress: TopicProgress) => {
  window.localStorage.setItem(FLASHCARD_PROGRESS_KEY, JSON.stringify(progress));
};

const readLeaderboard = (): LeaderboardEntry[] => {
  try {
    const rawLeaderboard = window.localStorage.getItem(FLASHCARD_LEADERBOARD_KEY);
    return rawLeaderboard ? (JSON.parse(rawLeaderboard) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
};

const writeLeaderboard = (entries: LeaderboardEntry[]) => {
  window.localStorage.setItem(FLASHCARD_LEADERBOARD_KEY, JSON.stringify(entries));
};

const unique = (items: string[]) => Array.from(new Set(items));

const getTimerPoints = (secondsLeft: number) => 100 + secondsLeft * 10;

const getProgressPercent = (progress: TopicProgress, topicId: TopicId, difficulty: Difficulty, totalCards: number) => {
  if (!totalCards) {
    return 0;
  }

  const entry = progress[getProgressKey(topicId, difficulty)];
  return Math.min(100, Math.round(((entry?.seenCardIds.length || 0) / totalCards) * 100));
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
    return <div className="flex aspect-video max-h-[42vh] w-full items-center justify-center text-sm font-semibold text-slate-300">Loading ASL video...</div>;
  }

  if (!videoSrc) {
    return <div className="flex aspect-video max-h-[42vh] w-full items-center justify-center text-sm font-semibold text-slate-300">Could not load this ASL video.</div>;
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
    className="aspect-video max-h-[42vh] w-full bg-slate-950 object-contain"
  />
  );
};

export const Flashcards = () => {
  const { user } = useAuth();
  const { cards, loading, error, refetch } = useFlashcards(10);
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CARD_TIME_LIMIT_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const [topicProgress, setTopicProgress] = useState<TopicProgress>(() => readProgress());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => readLeaderboard());
  const [lastAnswerPoints, setLastAnswerPoints] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const curatedCardsByLevel = useMemo(
    () =>
      difficultyOptions.reduce(
        (acc, option) => {
          acc[option.value] = selectedTopic ? curatedCardsByDifficulty[option.value].filter((card) => getTopic(card) === selectedTopic) : [];
          return acc;
        },
        {} as Record<Difficulty, Flashcard[]>
      ),
    [selectedTopic]
  );

  const practiceCards = useMemo(() => {
    if (!selectedTopic) {
      return [];
    }

    const cardsByDifficulty = cards.filter((card) => getDifficulty(card) === selectedDifficulty && getTopic(card) === selectedTopic);
    const curatedCards = curatedCardsByLevel[selectedDifficulty];
    const curatedCardIds = new Set(curatedCards.map((card) => card.id));

    return [...curatedCards, ...cardsByDifficulty.filter((card) => !curatedCardIds.has(card.id))];
  }, [cards, curatedCardsByLevel, selectedDifficulty, selectedTopic]);

  const currentCard = practiceCards[currentIndex];
  const progress = practiceCards.length ? Math.round(((currentIndex + 1) / practiceCards.length) * 100) : 0;
  const progressLabel = practiceCards.length ? `${currentIndex + 1}/${practiceCards.length}` : '0/0';
  const selectedTopicLabel = topicOptions.find((topic) => topic.id === selectedTopic)?.label || 'Choose Topic';
  const mediaUrl = getMediaUrl(currentCard);
  const currentSignData = getSignData(currentCard);
  const signAslVidref = String(currentSignData.signasl_ref || currentSignData.vidref || '');
  const sourceUrl = String(currentSignData.source_url || (!isVideoFile(mediaUrl) ? mediaUrl : ''));
  const isCorrect = Boolean(currentCard && selectedAnswer === currentCard.word);
  const sortedLeaderboard = useMemo(() => [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10), [leaderboard]);

  const answerOptions = useMemo(() => {
    if (!currentCard) {
      return [];
    }

    const wrongAnswers = shuffle(practiceCards.filter((card) => card.id !== currentCard.id))
      .slice(0, 3)
      .map((card) => card.word);

    return shuffle([currentCard.word, ...wrongAnswers]).slice(0, 4);
  }, [currentCard, practiceCards]);

  useEffect(() => {
    setSelectedAnswer('');
    setHasAnswered(false);
    setTimedOut(false);
    setLastAnswerPoints(0);
    setTimeLeft(CARD_TIME_LIMIT_SECONDS);
  }, [currentCard?.id]);

  useEffect(() => {
    if (!isTimerEnabled) {
      setTimeLeft(CARD_TIME_LIMIT_SECONDS);
      return;
    }

    if (!currentCard || hasAnswered || !selectedTopic) {
      return;
    }

    if (timeLeft <= 0) {
      setSelectedAnswer('__timeout__');
      setHasAnswered(true);
      setTimedOut(true);
      setTopicProgress((prev) => {
        const progressKey = getProgressKey(selectedTopic, selectedDifficulty);
        const entry = prev[progressKey] || { seenCardIds: [], correctCardIds: [], bestScore: 0, attempts: 0 };
        const nextProgress = {
          ...prev,
          [progressKey]: {
            ...entry,
            seenCardIds: unique([...entry.seenCardIds, currentCard.id]),
          },
        };

        writeProgress(nextProgress);
        return nextProgress;
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [currentCard, hasAnswered, isTimerEnabled, selectedDifficulty, selectedTopic, timeLeft]);

  useEffect(() => {
    setCurrentIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setLastAnswerPoints(0);
  }, [selectedDifficulty, selectedTopic]);

  useEffect(() => {
    if (currentIndex >= practiceCards.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, practiceCards.length]);

  const resetRound = () => {
    setCurrentIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setSelectedAnswer('');
    setHasAnswered(false);
    setTimedOut(false);
    setLastAnswerPoints(0);
    setTimeLeft(CARD_TIME_LIMIT_SECONDS);
  };

  const handleTimerToggle = () => {
    setIsTimerEnabled((prev) => !prev);
    resetRound();
  };

  const handleAnswer = (answer: string) => {
    if (!currentCard || hasAnswered || !selectedTopic) {
      return;
    }

    const answeredCorrectly = answer === currentCard.word;

    setSelectedAnswer(answer);
    setHasAnswered(true);
    setTopicProgress((prev) => {
      const progressKey = getProgressKey(selectedTopic, selectedDifficulty);
      const entry = prev[progressKey] || { seenCardIds: [], correctCardIds: [], bestScore: 0, attempts: 0 };
      const nextProgress = {
        ...prev,
        [progressKey]: {
          ...entry,
          seenCardIds: unique([...entry.seenCardIds, currentCard.id]),
          correctCardIds: answeredCorrectly ? unique([...entry.correctCardIds, currentCard.id]) : entry.correctCardIds,
        },
      };

      writeProgress(nextProgress);
      return nextProgress;
    });

    if (answeredCorrectly) {
      const earnedPoints = isTimerEnabled ? getTimerPoints(timeLeft) : 1;
      setLastAnswerPoints(earnedPoints);
      setScore((prev) => prev + earnedPoints);
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (!selectedTopic) {
      return;
    }

    if (currentIndex === practiceCards.length - 1) {
      await flashcardApi.recordScore(score, practiceCards.length);
      if (isTimerEnabled) {
        const userId = user?.id || 'guest';
        const userName = user?.full_name?.trim() || user?.email || 'Guest';
        const topicLabel = topicOptions.find((topic) => topic.id === selectedTopic)?.label || selectedTopic;
        const entry: LeaderboardEntry = {
          id: `${Date.now()}-${userId}-${selectedTopic}-${selectedDifficulty}`,
          userId,
          userName,
          topicId: selectedTopic,
          topicLabel,
          difficulty: selectedDifficulty,
          score,
          correct: correctAnswers,
          total: practiceCards.length,
          createdAt: new Date().toISOString(),
        };

        setLeaderboard((prev) => {
          const nextLeaderboard = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, 20);
          writeLeaderboard(nextLeaderboard);
          return nextLeaderboard;
        });
      }
      setTopicProgress((prev) => {
        const progressKey = getProgressKey(selectedTopic, selectedDifficulty);
        const entry = prev[progressKey] || { seenCardIds: [], correctCardIds: [], bestScore: 0, attempts: 0 };
        const nextProgress = {
          ...prev,
          [progressKey]: {
            ...entry,
            attempts: entry.attempts + 1,
            bestScore: Math.max(entry.bestScore, score),
          },
        };

        writeProgress(nextProgress);
        return nextProgress;
      });
      setScore(0);
      setCorrectAnswers(0);
      setLastAnswerPoints(0);
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
        {!selectedTopic ? (
          <section className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {topicOptions.map((topic) => {
                const levelCounts = difficultyOptions.map((option) => {
                  const totalCards = curatedCardsByDifficulty[option.value].filter((card) => getTopic(card) === topic.id).length;
                  return {
                    ...option,
                    totalCards,
                    progress: getProgressPercent(topicProgress, topic.id, option.value, totalCards),
                  };
                });
                const totalTopicCards = levelCounts.reduce((sum, level) => sum + level.totalCards, 0);
                const totalProgress = totalTopicCards
                  ? Math.round(
                      levelCounts.reduce((sum, level) => sum + Math.round((level.progress / 100) * level.totalCards), 0) / totalTopicCards * 100
                    )
                  : 0;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(topic.id)}
                    className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Layers className="size-5" />
                    </span>
                    <span className="block text-lg font-semibold text-slate-950">{topic.label}</span>
                    <span className="mt-2 block min-h-12 text-sm leading-6 text-slate-500">{topic.description}</span>
                    <span className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{totalTopicCards} cards</span>
                      <span>{totalProgress}% complete</span>
                    </span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${totalProgress}%` }} />
                    </span>
                    <span className="mt-4 grid gap-2">
                      {levelCounts.map((level) => (
                        <span key={level.value} className="grid grid-cols-[72px_1fr_38px] items-center gap-2 text-xs font-semibold">
                          <span className="text-slate-500">{level.label}</span>
                          <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${level.progress}%` }} />
                          </span>
                          <span className="text-slate-500">{level.progress}%</span>
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Timer Leaderboard</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">Highest timed round scores</h3>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Trophy className="size-5" />
                </div>
              </div>
              {sortedLeaderboard.length ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="hidden grid-cols-[64px_1.2fr_1fr_96px_96px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 md:grid">
                    <span>Rank</span>
                    <span>Name</span>
                    <span>Topic</span>
                    <span>Level</span>
                    <span className="text-right">Score</span>
                  </div>
                  <div className="grid gap-2 p-3">
                    {sortedLeaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="grid gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-sm md:grid-cols-[64px_1.2fr_1fr_96px_96px] md:items-center md:gap-3"
                      >
                        <span className="font-bold text-emerald-700">#{index + 1}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-950">{entry.userName}</span>
                          <span className="block text-xs text-slate-500 md:hidden">
                            {entry.topicLabel} / {entry.difficulty} / {entry.correct}/{entry.total}
                          </span>
                        </span>
                        <span className="hidden truncate text-slate-600 md:block">{entry.topicLabel}</span>
                        <span className="hidden capitalize text-slate-600 md:block">{entry.difficulty}</span>
                        <span className="font-bold text-slate-950 md:text-right">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                  Turn on timer inside any topic and finish a round to enter the leaderboard.
                </p>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Topic</p>
                  <h3 className="mt-0.5 truncate text-lg font-semibold text-slate-950">{selectedTopicLabel}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentCard && (
                    <>
                      <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                        Card {currentIndex + 1}/{practiceCards.length}
                      </span>
                      {isTimerEnabled && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold ${
                            timeLeft <= 5 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <Clock className="size-3.5" />
                          {timeLeft}s
                        </span>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleTimerToggle}
                    className={`inline-flex h-9 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition ${
                      isTimerEnabled
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="size-4" />
                    Timer {isTimerEnabled ? 'On' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTopic(null)}
                    className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Change topic
                  </button>
                </div>
              </div>

              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                {difficultyOptions.map((option) => {
                  const isActive = selectedDifficulty === option.value;
                  const levelTotalCards = curatedCardsByLevel[option.value].length;
                  const levelProgress = getProgressPercent(topicProgress, selectedTopic, option.value, levelTotalCards);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedDifficulty(option.value)}
                      className={`rounded-2xl border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold">{option.label}</span>
                        <span className="text-xs font-semibold text-emerald-700">{levelProgress}%</span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${levelProgress}%` }} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {loading && !currentCard && <LoadingState label="Preparing flashcards..." />}
              {error && !currentCard && <NoticeState tone="danger" title="Could not load flashcards" message={error} />}
              {!loading && !error && !currentCard && (
                <NoticeState tone="neutral" title="No cards in this level" message="Add ASL cards with a matching topic and difficulty to practice here." />
              )}

              {currentCard && (
                <>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>

                  {isTimerEnabled && (
                    <div
                      className={`mb-3 rounded-2xl border px-3 py-2 ${
                        timeLeft <= 5 ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-xs font-bold">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Time left: {timeLeft}s
                        </span>
                        <span>{getTimerPoints(timeLeft)} pts available</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                        <div
                          className={`h-full rounded-full transition-all ${timeLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.round((timeLeft / CARD_TIME_LIMIT_SECONDS) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mx-auto grid max-w-5xl gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-stretch">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
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
                          className="aspect-video max-h-[42vh] w-full bg-slate-950 object-contain"
                        />
                      ) : (
                        <div className="flex aspect-video max-h-[42vh] items-center justify-center px-6 text-center text-sm text-slate-300">
                          This flashcard does not have a playable ASL video yet.
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-950 lg:content-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                          {isTimerEnabled ? 'Round points' : 'Round score'}
                        </p>
                        <p className="mt-2 text-5xl font-black leading-none">{score}</p>
                      </div>
                      {isTimerEnabled && (
                        <div className="rounded-xl bg-white/75 px-3 py-2">
                          <p className="text-xs font-semibold text-emerald-700">Available</p>
                          <p className="text-xl font-black">{getTimerPoints(timeLeft)} pts</p>
                        </div>
                      )}
                      <div className="rounded-xl bg-white/75 px-3 py-2">
                        <p className="text-xs font-semibold text-emerald-700">Progress</p>
                        <p className="text-xl font-black">{progressLabel}</p>
                      </div>
                    </div>
                  </div>

                  {sourceUrl && hasAnswered && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Open video source
                      <ExternalLink className="size-4" />
                    </a>
                  )}

                  <div className="mx-auto mt-3 grid max-w-5xl gap-2 sm:grid-cols-2">
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
                          className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left text-base font-semibold shadow-sm transition ${
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
                      className={`mx-auto mt-3 max-w-5xl rounded-2xl px-4 py-3 text-sm font-semibold ${
                        isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {timedOut
                        ? `Time's up. The answer is: ${currentCard.word}`
                        : isCorrect
                          ? isTimerEnabled
                            ? `Correct! +${lastAnswerPoints} pts`
                            : 'Correct!'
                          : `Not quite. The answer is: ${currentCard.word}`}
                    </div>
                  )}

                  <div className="mx-auto mt-3 flex max-w-5xl justify-end">
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

          </>
        )}
      </div>
    </PanelShell>
  );
};

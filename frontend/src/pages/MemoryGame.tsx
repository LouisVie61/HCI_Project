import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardApi } from '../api';
import { useFlashcards } from '../hooks';
import type { Flashcard } from '../types';

type MemoryCardKind = 'word' | 'sign';

interface MemoryCard {
  id: string;
  pairId: string;
  kind: MemoryCardKind;
  label: string;
  value: string;
}

const sampleCards: Flashcard[] = [
  { id: 'hello', word: 'Hello', sign_data: { label: '👋' } },
  { id: 'thanks', word: 'Thank you', sign_data: { label: '🙏' } },
  { id: 'love', word: 'Love', sign_data: { label: '❤️' } },
  { id: 'yes', word: 'Yes', sign_data: { label: '👍' } },
  { id: 'no', word: 'No', sign_data: { label: '✋' } },
  { id: 'learn', word: 'Learn', sign_data: { label: '📘' } },
];

const getSignLabel = (card: Flashcard, index: number) => {
  if (typeof card.sign_data === 'string') {
    return card.sign_data;
  }

  if (card.sign_data?.label) {
    return String(card.sign_data.label);
  }

  if (card.sign_data?.name) {
    return String(card.sign_data.name);
  }

  return ['👋', '🙏', '❤️', '👍', '✋', '📘'][index % 6];
};

const shuffleCards = (cards: MemoryCard[]) =>
  [...cards].sort(() => Math.random() - 0.5);

const buildMemoryCards = (flashcards: Flashcard[]) =>
  shuffleCards(
    flashcards.flatMap((card, index) => [
      {
        id: `${card.id}-word`,
        pairId: card.id,
        kind: 'word' as const,
        label: 'Từ vựng',
        value: card.word,
      },
      {
        id: `${card.id}-sign`,
        pairId: card.id,
        kind: 'sign' as const,
        label: 'Ký hiệu',
        value: getSignLabel(card, index),
      },
    ])
  );

export const MemoryGame = () => {
  const navigate = useNavigate();
  const {
    cards,
    loading,
    error,
    score,
    userScore,
    recordAnswer,
    refetch,
  } = useFlashcards(6);
  const submittedMatchCountRef = useRef(0);
  const [savedTotalScore, setSavedTotalScore] = useState(0);
  const sourceCards = useMemo(
    () => (cards.length > 0 ? cards.slice(0, 6) : sampleCards),
    [cards]
  );
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() =>
    buildMemoryCards(sourceCards)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  const matchedPairs = matchedIds.length / 2;
  const totalPairs = memoryCards.length / 2;
  const isCompleted = totalPairs > 0 && matchedPairs === totalPairs;

  useEffect(() => {
    setSavedTotalScore(userScore?.total_score ?? 0);
  }, [userScore]);

  const resetGame = () => {
    setMemoryCards(buildMemoryCards(sourceCards));
    setSelectedIds([]);
    setMatchedIds([]);
    setMoves(0);
    submittedMatchCountRef.current = 0;
  };

  useEffect(() => {
    setMemoryCards(buildMemoryCards(sourceCards));
    setSelectedIds([]);
    setMatchedIds([]);
    setMoves(0);
    submittedMatchCountRef.current = 0;
  }, [sourceCards]);

  useEffect(() => {
    if (selectedIds.length !== 2) {
      return;
    }

    const [firstId, secondId] = selectedIds;
    const firstCard = memoryCards.find((card) => card.id === firstId);
    const secondCard = memoryCards.find((card) => card.id === secondId);

    setMoves((currentMoves) => currentMoves + 1);

    if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
      setMatchedIds((currentMatchedIds) => [
        ...currentMatchedIds,
        firstId,
        secondId,
      ]);
      recordAnswer(true);
      setSelectedIds([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedIds([]);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [memoryCards, selectedIds]);

  const handleCardClick = (card: MemoryCard) => {
    if (
      selectedIds.length === 2 ||
      selectedIds.includes(card.id) ||
      matchedIds.includes(card.id)
    ) {
      return;
    }

    setSelectedIds((currentSelectedIds) => [...currentSelectedIds, card.id]);
  };

  useEffect(() => {
    if (!isCompleted || submittedMatchCountRef.current === matchedPairs) {
      return;
    }

    submittedMatchCountRef.current = matchedPairs;
    flashcardApi.recordScore(matchedPairs, totalPairs).then((result) => {
      if (result.data) {
        setSavedTotalScore(result.data.total_score);
      }
    });
  }, [isCompleted, matchedPairs, totalPairs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-700 hover:text-gray-950 font-medium"
          >
            ← Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Memory Game</h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Flashcard</p>
              <h2 className="text-2xl font-bold text-gray-900">
                Ghép nối từ vựng với ký hiệu
              </h2>
              {error && (
                <p className="mt-2 text-sm text-amber-700">
                  Chưa tải được flashcard từ server, đang dùng bộ thẻ mẫu.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <span className="text-sm text-gray-600">Lượt</span>
                <strong className="ml-2 text-gray-900">{moves}</strong>
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <span className="text-sm text-gray-600">Đã đúng</span>
                <strong className="ml-2 text-gray-900">
                  {matchedPairs}/{totalPairs}
                </strong>
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <span className="text-sm text-gray-600">Điểm ván</span>
                <strong className="ml-2 text-gray-900">{score}</strong>
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <span className="text-sm text-gray-600">Tổng DB</span>
                <strong className="ml-2 text-gray-900">{savedTotalScore}</strong>
              </div>
            </div>
          </div>

          {loading && cards.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-600">
              Đang tải flashcard...
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {memoryCards.map((card) => {
                const isOpen =
                  selectedIds.includes(card.id) || matchedIds.includes(card.id);

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`aspect-[4/3] rounded-lg border p-4 text-center transition ${
                      isOpen
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {isOpen ? (
                      <span className="flex h-full flex-col items-center justify-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          {card.label}
                        </span>
                        <span
                          className={
                            card.kind === 'sign'
                              ? 'text-4xl font-bold text-gray-900'
                              : 'text-lg font-bold text-gray-900'
                          }
                        >
                          {card.value}
                        </span>
                      </span>
                    ) : (
                      <span className="flex h-full items-center justify-center text-3xl">
                        ?
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              {isCompleted
                ? 'Hoàn thành! Bạn đã ghép hết các cặp thẻ.'
                : 'Chọn 2 thẻ để tìm cặp từ vựng và ký hiệu tương ứng.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetGame}
                className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Chơi lại
              </button>
              <button
                onClick={refetch}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-800 hover:bg-gray-100"
              >
                Đổi thẻ
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

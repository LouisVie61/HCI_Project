import { useState, useCallback } from 'react';
import { Flashcard, UserScore } from '../types';
import { flashcardApi } from '../api/endpoints';
import { useAsync } from './useAsync';

export const useFlashcards = (limit: number = 10) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  const { data: cards, loading, error, retry } = useAsync<Flashcard[]>(
    () => flashcardApi.getRandomCards(limit),
    { immediate: true }
  );

  const { data: userScore } = useAsync<UserScore>(
    () => flashcardApi.getScore(),
    { immediate: true }
  );

  const nextCard = useCallback(() => {
    if (cards && currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [cards, currentIndex]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const recordAnswer = useCallback(
    async (isCorrect: boolean) => {
      if (isCorrect) {
        setScore((prev) => prev + 1);
      }
    },
    []
  );

  const submitScore = useCallback(async () => {
    const result = await flashcardApi.recordScore(score, cards?.length || 0);
    if (!result.error) {
      // Reset for new game
      setScore(0);
      setCurrentIndex(0);
      retry();
    }
  }, [score, cards?.length, retry]);

  const currentCard = cards?.[currentIndex];

  return {
    cards: cards || [],
    currentCard,
    currentIndex,
    score,
    userScore: userScore || null,
    loading,
    error,
    nextCard,
    prevCard,
    recordAnswer,
    submitScore,
    refetch: retry,
  };
};

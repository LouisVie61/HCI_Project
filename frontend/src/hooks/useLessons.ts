import { useState, useCallback, useEffect, useRef } from 'react';
import { Lesson } from '../types';
import { lessonApi } from '../api/endpoints';
import { useAsync } from './useAsync';

export const useLessons = () => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const fetchLessons = useCallback(
    () => lessonApi.getAll(search, difficulty),
    [search, difficulty]
  );

  const { data: lessons, loading, error, retry } = useAsync<Lesson[]>(
    fetchLessons,
    { immediate: true }
  );

  const hasLoadedInitialLessons = useRef(false);

  useEffect(() => {
    if (!hasLoadedInitialLessons.current) {
      hasLoadedInitialLessons.current = true;
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      retry();
    }, 250);

    return () => window.clearTimeout(refreshTimer);
  }, [difficulty, retry, search]);

  return {
    lessons: lessons || [],
    loading,
    error,
    search,
    setSearch,
    difficulty,
    setDifficulty,
    refetch: retry,
  };
};

export const useLesson = (id: string) => {
  const { data: lesson, loading, error, retry } = useAsync(
    () => lessonApi.getById(id),
    { immediate: !!id }
  );

  return {
    lesson: lesson as Lesson | null,
    loading,
    error,
    refetch: retry,
  };
};

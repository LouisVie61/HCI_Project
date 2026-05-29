import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Lesson, LessonProgress } from '../types';
import { lessonApi } from '../api/endpoints';
import { useAsync } from './useAsync';

export const useLessons = () => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [learningStatus, setLearningStatus] = useState('');

  const fetchLessons = useCallback(
    () => lessonApi.getAll(search, difficulty),
    [search, difficulty]
  );

  const { data: lessons, loading, error, retry } = useAsync<Lesson[]>(
    fetchLessons,
    { immediate: true }
  );

  const {
    data: progressList,
    loading: progressLoading,
    error: progressError,
    retry: retryProgress,
  } = useAsync<LessonProgress[]>(
    () => lessonApi.getAllProgress(),
    { immediate: true }
  );

  const progressByLessonId = useMemo(() => {
    return (progressList || []).reduce<Record<string, LessonProgress>>((progressMap, progress) => {
      progressMap[progress.lesson_id] = progress;
      return progressMap;
    }, {});
  }, [progressList]);

  const filteredLessons = useMemo(() => {
    const currentLessons = lessons || [];

    if (!learningStatus) {
      return currentLessons;
    }

    return currentLessons.filter((lesson) => {
      const progressPercent = progressByLessonId[lesson.id]?.progress_percent || 0;
      const hasLearned = progressPercent > 0;

      if (learningStatus === 'learned') {
        return hasLearned;
      }

      if (learningStatus === 'unlearned') {
        return !hasLearned;
      }

      return true;
    });
  }, [learningStatus, lessons, progressByLessonId]);

  const refetch = useCallback(() => {
    retry();
    retryProgress();
  }, [retry, retryProgress]);

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
    lessons: filteredLessons,
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

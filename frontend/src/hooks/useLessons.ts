import { useState, useCallback } from 'react';
import { Lesson } from '../types';
import { lessonApi } from '../api/endpoints';
import { useAsync } from './useAsync';

export const useLessons = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const fetchLessons = useCallback(
    () => lessonApi.getAll(search, filter),
    [search, filter]
  );

  const { data: lessons, loading, error, retry } = useAsync<Lesson[]>(
    fetchLessons,
    { immediate: true }
  );

  return {
    lessons: lessons || [],
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
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

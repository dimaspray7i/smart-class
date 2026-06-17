import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useScheduleFilters() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const debouncedSearch = useDebounce(search, 500);

  const resetFilters = () => {
    setSearch('');
    setClassFilter('all');
    setDayFilter('all');
    setTeacherFilter('all');
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, classFilter, dayFilter, teacherFilter]);

  return {
    search,
    setSearch,
    classFilter,
    setClassFilter,
    dayFilter,
    setDayFilter,
    teacherFilter,
    setTeacherFilter,
    page,
    setPage,
    showFilters,
    setShowFilters,
    viewMode,
    setViewMode,
    debouncedSearch,
    resetFilters,
  };
}

import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useClassFilters() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const debouncedSearch = useDebounce(search, 500);

  const resetFilters = () => {
    setSearch('');
    setLevelFilter('all');
    setMajorFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, levelFilter, majorFilter, statusFilter]);

  return {
    search,
    setSearch,
    levelFilter,
    setLevelFilter,
    majorFilter,
    setMajorFilter,
    statusFilter,
    setStatusFilter,
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

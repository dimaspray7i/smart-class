import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useUserFilters() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const debouncedSearch = useDebounce(search, 500);

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setClassFilter('all');
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, classFilter]);

  return {
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
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

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';

export function useDashboardData() {
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics/attendance'),
    staleTime: 5 * 60 * 1000,
  });

  const overview = dashboard?.data?.overview || {};
  const systemHealth = dashboard?.data?.system_health || {};
  const recentActivity = dashboard?.data?.recent_activity || {};

  return {
    dashboard,
    analyticsData,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    overview,
    systemHealth,
    recentActivity,
  };
}

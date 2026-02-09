import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { DnsCachePerformance } from './DnsCachePerformance'

interface CachePerformanceWidgetProps {
  timeRange: string
  className?: string
}

export function CachePerformanceWidget({ timeRange, className }: CachePerformanceWidgetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cache-performance', timeRange],
    queryFn: () => apiClient.getCachePerformance(timeRange),
    refetchInterval: 30000,
    staleTime: 25000,
  })

  return (
    <DnsCachePerformance 
      data={data?.cache_data || []}
      metrics={data?.metrics || {
        hit_rate: 0,
        miss_rate: 0,
        total_queries: 0,
        avg_hit_time: 0,
        avg_miss_time: 0,
        performance_score: 0
      }}
      isLoading={isLoading}
      className={className}
    />
  )
}

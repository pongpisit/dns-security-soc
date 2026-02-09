import { useQuery } from '@tanstack/react-query'
import { apiClient, UnifiedDashboardData } from '../services/api'

/**
 * Shared hook for unified dashboard data across all pages
 * Ensures all components use the same dataset with shared caching
 */
export function useUnifiedDashboardData(timeRange: string = '24h') {
  return useQuery({
    queryKey: ['dashboard-unified', timeRange],
    queryFn: () => apiClient.getUnifiedDashboardData(timeRange),
    refetchInterval: 30000, // Consistent refresh interval
    staleTime: 25000, // Consider data stale after 25 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  })
}

/**
 * Hook specifically for dashboard overview data
 */
export function useDashboardOverview(timeRange: string = '24h') {
  const { data: unifiedData, ...rest } = useUnifiedDashboardData(timeRange)
  
  return {
    data: unifiedData ? { success: true, data: unifiedData.overview } : null,
    ...rest
  }
}

/**
 * Hook specifically for time series data
 */
export function useTimeSeriesData(timeRange: string = '24h') {
  const { data: unifiedData, ...rest } = useUnifiedDashboardData(timeRange)
  
  return {
    data: unifiedData ? { success: true, data: unifiedData.time_series } : null,
    ...rest
  }
}

/**
 * Hook specifically for geographic data
 */
export function useGeographicData(timeRange: string = '24h') {
  const { data: unifiedData, ...rest } = useUnifiedDashboardData(timeRange)
  
  return {
    data: unifiedData ? { success: true, data: unifiedData.countries } : null,
    ...rest
  }
}

/**
 * Hook specifically for top threats data
 */
export function useTopThreats(timeRange: string = '24h') {
  const { data: unifiedData, ...rest } = useUnifiedDashboardData(timeRange)
  
  return {
    data: unifiedData ? { success: true, data: unifiedData.top_blocked } : null,
    ...rest
  }
}

/**
 * Hook specifically for top applications data
 */
export function useTopApplications(timeRange: string = '24h') {
  const { data: unifiedData, ...rest } = useUnifiedDashboardData(timeRange)
  
  return {
    data: unifiedData ? { success: true, data: unifiedData.top_applications } : null,
    ...rest
  }
}

/**
 * Hook specifically for top domains data
 */
export function useTopDomains(timeRange: string = '24h') {
  const { data: unifiedData, ...rest } = useUnifiedDashboardData(timeRange)
  
  return {
    data: unifiedData ? { success: true, data: unifiedData.top_domains } : null,
    ...rest
  }
}

/**
 * Hook for recent queries derived from unified data
 * This provides a sample of queries for dashboard display
 */
export function useRecentQueriesFromUnified(timeRange: string = '24h', limit: number = 10) {
  const { data: unifiedData, ...rest } = useUnifiedDashboardData(timeRange)
  
  // For recent queries display, we can derive from top domains or use a separate call
  // Since unified data doesn't contain individual query records, we'll indicate this
  return {
    data: null, // Unified data doesn't contain individual query records
    shouldUseSeparateCall: true, // Indicates component should use separate getQueries call
    ...rest
  }
}

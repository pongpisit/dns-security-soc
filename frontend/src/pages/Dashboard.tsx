import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Globe, 
  TrendingUp, 
  Clock,
  Server,
  Users,
  RefreshCw
} from 'lucide-react'
import { apiClient } from '../services/api'
import { MetricCard } from '../components/MetricCard'
import { TimePicker } from '../components/TimePicker'
import { TimeSeriesChart } from '../components/TimeSeriesChart'
import { ThreatMap } from '../components/ThreatMap'
import { TopApplications } from '../components/TopApplications'
import { TopCategories } from '../components/TopCategories'
import { TopBlockedDomains } from '../components/TopBlockedDomains'
import { TopBlockedCategories } from '../components/TopBlockedCategories'
import { CloudflareCategories } from '../components/CloudflareCategories'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DataFreshnessIndicator } from '../components/DataFreshnessIndicator'
import { ResolverDecisions } from '../components/ResolverDecisions'
import { DnsRecordTypes } from '../components/DnsRecordTypes'
import { PolicyEnforcementReal } from '../components/PolicyEnforcementReal'
import { DestinationCountries } from '../components/DestinationCountries'
import { useUnifiedDashboardData } from '../hooks/useUnifiedDashboardData'
import { DebugPanel } from '../components/DebugPanel'
import { DnsResolutionChain } from '../components/DnsResolutionChain'
import { DnsCachePerformance } from '../components/DnsCachePerformance'
import { AuthoritativeNameservers } from '../components/AuthoritativeNameservers'
import { DnsErrorsAnalysis } from '../components/DnsErrorsAnalysis'
import { DnsProtocolUsage } from '../components/DnsProtocolUsage'

export function Dashboard() {
  const [timeRange, setTimeRange] = useState('24h')
  const [showDebug, setShowDebug] = useState(true) // Show debug panel by default

  // Single unified data source for entire dashboard (shared across all pages)
  const { data: unifiedData, isLoading: unifiedLoading, error: unifiedError } = useUnifiedDashboardData(timeRange)

  // Network Intelligence data sources
  const { data: resolutionChainsResponse } = useQuery({
    queryKey: ['resolution-chains', timeRange],
    queryFn: () => apiClient.getResolutionChains(timeRange),
    refetchInterval: 60000
  })

  const { data: authNameserversResponse } = useQuery({
    queryKey: ['authoritative-nameservers', timeRange],
    queryFn: () => apiClient.getAuthoritativeNameservers(timeRange),
    refetchInterval: 60000
  })

  const { data: dnsErrorsResponse } = useQuery({
    queryKey: ['dns-errors', timeRange],
    queryFn: () => apiClient.getDnsErrors(timeRange),
    refetchInterval: 60000
  })

  const { data: cachePerformanceResponse } = useQuery({
    queryKey: ['cache-performance', timeRange],
    queryFn: () => apiClient.getCachePerformance(timeRange),
    refetchInterval: 60000
  })

  const { data: protocolUsageResponse } = useQuery({
    queryKey: ['protocol-usage', timeRange],
    queryFn: () => apiClient.getProtocolUsage(timeRange),
    refetchInterval: 60000
  })


  // Extract data from unified source
  const overviewData = unifiedData ? { success: true, data: unifiedData.overview } : null
  const timeSeriesData = unifiedData ? { success: true, data: unifiedData.time_series } : null
  const threatsData = unifiedData ? { success: true, data: unifiedData.top_blocked.slice(0, 5) } : null
  
  const overviewLoading = unifiedLoading
  const timeSeriesLoading = unifiedLoading
  const overviewError = unifiedError

  // Calculate metrics from unified overview data (same as Analytics)
  const totalQueries = unifiedData?.overview?.total_queries_24h || 0
  const blockedQueries = unifiedData?.overview?.blocked_queries_24h || 0
  const avgThreatScore = unifiedData?.overview?.threat_detection_rate || 0
  const uniqueThreats = unifiedData?.overview?.unique_threats_24h || 0

  const blockRate = totalQueries > 0 ? (blockedQueries / totalQueries) * 100 : 0

  if (overviewLoading && timeSeriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DNS Security Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time monitoring and threat analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <TimePicker 
            value={timeRange} 
            onChange={setTimeRange}
          />
          <DataFreshnessIndicator
            isLoading={unifiedLoading}
            isError={!!unifiedError}
            dataAge={1}
            className="bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700"
          />
          <button 
            className="btn-secondary flex items-center"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Total DNS Queries</div>
              <div className="text-3xl font-bold text-white">{totalQueries.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Last 24 hours</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Blocked Queries</div>
              <div className="text-3xl font-bold text-red-400">{blockedQueries.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{blockRate.toFixed(1)}% block rate</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Threat Detection Rate</div>
              <div className="text-3xl font-bold text-yellow-400">{avgThreatScore.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">{avgThreatScore > 50 ? 'High alert' : 'Normal'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Geographic Coverage</div>
              <div className="text-3xl font-bold text-blue-400">{unifiedData?.countries?.length || 0}</div>
              <div className="text-xs text-gray-500">Active countries</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Unique Threats</span>
              <span className="text-lg font-semibold text-white">{uniqueThreats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Allowed Queries</span>
              <span className="text-lg font-semibold text-white">{(totalQueries - blockedQueries).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Success Rate</span>
              <span className="text-lg font-semibold text-green-400">{(100 - blockRate).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Query Activity Trends */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Query Activity Trends</h2>
      </div>
      <TimeSeriesChart 
        data={unifiedData?.time_series || []} 
      />

      {/* Security Intelligence */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Security Intelligence</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopBlockedDomains 
          data={unifiedData?.top_blocked || []}
          isLoading={unifiedLoading}
        />
        
        <ThreatMap data={unifiedData?.countries || []} />
      </div>

      {/* Domain Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Allowed Domains */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Allowed Domains</h3>
            <div className="text-sm text-gray-400">Safe traffic</div>
          </div>
          {unifiedLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : unifiedData?.top_allowed && unifiedData.top_allowed.length > 0 ? (
            <div className="space-y-2">
              {unifiedData.top_allowed.slice(0, 10).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-500 mr-2">#{index + 1}</span>
                      <p className="text-sm font-medium text-white truncate">{item.domain}</p>
                    </div>
                    <div className="flex items-center mt-1 space-x-3">
                      <span className="text-xs text-gray-400">{item.query_count.toLocaleString()} queries</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{item.unique_sources} sources</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{item.query_types}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-success-500/20 rounded-full">
                      <Shield className="h-4 w-4 text-success-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Shield className="h-12 w-12 text-success-400 mb-3" />
              <h4 className="text-lg font-medium text-success-400">All Clear!</h4>
              <p className="text-sm text-gray-400 mt-2">
                No allowed domains data available yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category Analysis */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Category Analysis</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Applications */}
        <TopApplications 
          data={unifiedData?.top_applications || []} 
          isLoading={unifiedLoading}
        />

        {/* Cloudflare Categories */}
        <CloudflareCategories 
          data={unifiedData?.top_categories || []}
          isLoading={unifiedLoading}
        />

        {/* Top Blocked Categories */}
        <TopBlockedCategories 
          data={unifiedData?.top_blocked || []}
          isLoading={unifiedLoading}
        />
      </div>

      {/* DNS Infrastructure */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">DNS Infrastructure</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolver Decisions - Real GraphQL data */}
        <ResolverDecisions 
          data={unifiedData?.top_domains || []}
          isLoading={unifiedLoading}
        />

        {/* DNS Record Types - Real GraphQL data */}
        <DnsRecordTypes 
          data={unifiedData?.top_domains || []}
          isLoading={unifiedLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy Enforcement - Real GraphQL data */}
        <PolicyEnforcementReal 
          data={unifiedData?.top_domains || []}
          isLoading={unifiedLoading}
        />

        {/* Destination Countries - Real GraphQL data */}
        <DestinationCountries 
          data={unifiedData?.top_domains || []}
          isLoading={unifiedLoading}
        />
      </div>

      {/* Network Intelligence Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Network Intelligence</h2>
          <p className="text-sm text-gray-400">Resolution analysis, cache performance, and error tracking</p>
        </div>

        {/* Network Intelligence Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DnsResolutionChain 
            data={resolutionChainsResponse?.data || []}
            isLoading={!resolutionChainsResponse}
          />
          
          <AuthoritativeNameservers 
            data={authNameserversResponse?.data || []}
            metrics={{
              total_nameservers: 0,
              avg_response_time: 0,
              overall_success_rate: 0,
              healthy_servers: 0,
              geographic_distribution: []
            }}
            isLoading={!authNameserversResponse}
          />
        </div>

        {/* Network Intelligence Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DnsCachePerformance 
            data={cachePerformanceResponse?.cache_data || []}
            metrics={cachePerformanceResponse?.metrics || { hit_rate: 0, miss_rate: 0, total_queries: 0, avg_hit_time: 0, avg_miss_time: 0, performance_score: 0 }}
            isLoading={!cachePerformanceResponse}
          />
          
          <DnsErrorsAnalysis 
            data={dnsErrorsResponse?.data || []}
            metrics={{
              total_errors: 0,
              error_rate: 0,
              most_common_error: '',
              critical_errors: 0,
              trend_direction: 'stable'
            }}
            isLoading={!dnsErrorsResponse}
          />
        </div>

        {/* Network Intelligence Row 3 - Protocol Usage (Full Width) */}
        <DnsProtocolUsage 
          data={protocolUsageResponse || []}
          isLoading={!protocolUsageResponse}
        />
      </div>

      {/* Error States */}
      {overviewError && (
        <div className="card border-danger-600 bg-danger-900/20">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-danger-400 mr-3" />
            <div>
              <h4 className="text-danger-400 font-medium">Dashboard Error</h4>
              <p className="text-sm text-gray-400 mt-1">
                Unable to load dashboard overview. The system is still collecting data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel - Shows data source, queries, and debugging info */}
      {showDebug && (
        <DebugPanel 
          data={unifiedData}
          isLoading={unifiedLoading}
          error={unifiedError}
        />
      )}
    </div>
  )
}

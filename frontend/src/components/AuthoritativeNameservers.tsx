import React from 'react'
import { Server, Globe, Clock, TrendingUp, MapPin, Activity } from 'lucide-react'

interface NameserverData {
  ip_address: string
  hostname: string
  queries: number
  response_time: number
  success_rate: number
  geographic_location: string
  provider: string
  domains_served: string[]
  last_seen: string
  status: 'healthy' | 'degraded' | 'offline'
  trend: 'up' | 'down' | 'stable'
}

interface NameserverMetrics {
  total_nameservers: number
  avg_response_time: number
  overall_success_rate: number
  healthy_servers: number
  geographic_distribution: Array<{ region: string; count: number }>
}

interface AuthoritativeNameserversProps {
  data: NameserverData[]
  metrics: NameserverMetrics
  isLoading?: boolean
  className?: string
}

export function AuthoritativeNameservers({ 
  data, 
  metrics, 
  isLoading, 
  className = '' 
}: AuthoritativeNameserversProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">Authoritative Nameservers</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Server className="h-4 w-4 mr-1" />
            <span>DNS infrastructure</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">Authoritative Nameservers</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Server className="h-4 w-4 mr-1" />
            <span>DNS infrastructure</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No nameserver data available</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'degraded':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'offline':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      case 'degraded':
        return <div className="w-2 h-2 bg-amber-400 rounded-full" />
      case 'offline':
        return <div className="w-2 h-2 bg-red-400 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-400" />
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />
      default:
        return <Activity className="h-3 w-3 text-gray-400" />
    }
  }

  const getPerformanceColor = (responseTime: number) => {
    if (responseTime < 50) return 'text-green-400'
    if (responseTime < 100) return 'text-blue-400'
    if (responseTime < 200) return 'text-amber-400'
    return 'text-red-400'
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 99) return 'text-green-400'
    if (rate >= 95) return 'text-blue-400'
    if (rate >= 90) return 'text-amber-400'
    return 'text-red-400'
  }

  // Sort nameservers by queries (most active first)
  const sortedNameservers = [...data].sort((a, b) => b.queries - a.queries)

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">Authoritative Nameservers</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Server className="h-4 w-4 mr-1" />
            <span>{metrics.total_nameservers} servers</span>
          </div>
          <div className="text-sm font-medium text-green-400">
            {metrics.healthy_servers}/{metrics.total_nameservers} healthy
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {metrics.healthy_servers}
          </div>
          <div className="text-xs text-gray-400">Healthy</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${getPerformanceColor(metrics.avg_response_time)}`}>
            {metrics.avg_response_time}ms
          </div>
          <div className="text-xs text-gray-400">Avg Response</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${getSuccessRateColor(metrics.overall_success_rate)}`}>
            {metrics.overall_success_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Success Rate</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {metrics.geographic_distribution.length}
          </div>
          <div className="text-xs text-gray-400">Regions</div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Geographic Distribution</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {metrics.geographic_distribution.slice(0, 8).map((region) => (
            <div key={region.region} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-300">{region.region}</span>
              </div>
              <span className="text-xs font-medium text-primary-400">{region.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nameserver List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedNameservers.slice(0, 10).map((nameserver) => (
          <div key={nameserver.ip_address} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(nameserver.status)}
                  <Server className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{nameserver.hostname || nameserver.ip_address}</h4>
                  <p className="text-xs text-gray-400">{nameserver.ip_address}</p>
                  {nameserver.provider && (
                    <p className="text-xs text-gray-500">{nameserver.provider}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(nameserver.trend)}
                <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(nameserver.status)}`}>
                  {nameserver.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-sm font-bold text-primary-400">
                  {nameserver.queries.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Queries</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${getPerformanceColor(nameserver.response_time)}`}>
                  {nameserver.response_time}ms
                </div>
                <div className="text-xs text-gray-400">Response</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${getSuccessRateColor(nameserver.success_rate)}`}>
                  {nameserver.success_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Success</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-300">
                  {nameserver.domains_served.length}
                </div>
                <div className="text-xs text-gray-400">Domains</div>
              </div>
            </div>

            {/* Geographic Location */}
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">{nameserver.geographic_location}</span>
            </div>

            {/* Served Domains */}
            {nameserver.domains_served.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Serving domains:</div>
                <div className="flex flex-wrap gap-1">
                  {nameserver.domains_served.slice(0, 4).map((domain, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                    >
                      {domain}
                    </span>
                  ))}
                  {nameserver.domains_served.length > 4 && (
                    <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
                      +{nameserver.domains_served.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Last Seen */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Last seen: {new Date(nameserver.last_seen).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span>
                  {nameserver.trend === 'up' ? 'Improving' : nameserver.trend === 'down' ? 'Degrading' : 'Stable'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infrastructure Health Summary */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Globe className="h-4 w-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Infrastructure Health</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="text-gray-400">
            <span className="text-green-400">Best Performance:</span> {
              [...data].sort((a, b) => a.response_time - b.response_time)[0]?.hostname || 'N/A'
            }
          </div>
          <div className="text-gray-400">
            <span className="text-blue-400">Most Active:</span> {
              sortedNameservers[0]?.hostname || 'N/A'
            }
          </div>
          <div className="text-gray-400">
            <span className="text-amber-400">Health Status:</span> {
              metrics.healthy_servers === metrics.total_nameservers ? 'All systems operational' :
              metrics.healthy_servers / metrics.total_nameservers > 0.8 ? 'Mostly healthy' :
              'Requires attention'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

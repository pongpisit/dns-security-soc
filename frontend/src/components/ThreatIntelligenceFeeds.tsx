import React from 'react'
import { Shield, AlertTriangle, Eye, TrendingUp, Activity } from 'lucide-react'

interface ThreatFeedData {
  feed_name: string
  feed_id: string
  matches: number
  blocked_queries: number
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  last_updated: string
  categories: string[]
  accuracy_rate: number
  trend: 'up' | 'down' | 'stable'
}

interface ThreatIntelligenceFeedsProps {
  data: ThreatFeedData[]
  totalMatches: number
  isLoading?: boolean
  className?: string
}

export function ThreatIntelligenceFeeds({ 
  data, 
  totalMatches, 
  isLoading, 
  className = '' 
}: ThreatIntelligenceFeedsProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">Threat Intelligence Feeds</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Eye className="h-4 w-4 mr-1" />
            <span>Active feeds</span>
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
          <h3 className="card-title">Threat Intelligence Feeds</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Eye className="h-4 w-4 mr-1" />
            <span>Active feeds</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No threat intelligence data available</p>
          </div>
        </div>
      </div>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'medium':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <Eye className="h-4 w-4" />
      case 'low':
        return <Shield className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-400" />
      case 'down':
        return <TrendingUp className="h-3 w-3 text-green-400 rotate-180" />
      default:
        return <Activity className="h-3 w-3 text-gray-400" />
    }
  }

  const getAccuracyColor = (rate: number) => {
    if (rate >= 95) return 'text-green-400'
    if (rate >= 85) return 'text-blue-400'
    if (rate >= 70) return 'text-amber-400'
    return 'text-red-400'
  }

  // Sort feeds by matches (most active first)
  const sortedFeeds = [...data].sort((a, b) => b.matches - a.matches)

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">Threat Intelligence Feeds</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Eye className="h-4 w-4 mr-1" />
            <span>{data.length} active feeds</span>
          </div>
          <div className="text-sm font-medium text-primary-400">
            {totalMatches.toLocaleString()} total matches
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {data.filter(f => f.risk_level === 'critical').length}
          </div>
          <div className="text-xs text-gray-400">Critical Feeds</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-400">
            {data.filter(f => f.risk_level === 'high').length}
          </div>
          <div className="text-xs text-gray-400">High Risk</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {data.reduce((sum, f) => sum + f.blocked_queries, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Blocked</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {(data.reduce((sum, f) => sum + f.accuracy_rate, 0) / data.length).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Avg Accuracy</div>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedFeeds.map((feed) => (
          <div key={feed.feed_id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${getRiskColor(feed.risk_level)}`}>
                  {getRiskIcon(feed.risk_level)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{feed.feed_name}</h4>
                  <p className="text-xs text-gray-400">ID: {feed.feed_id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(feed.trend)}
                <span className={`px-2 py-1 text-xs rounded-full border ${getRiskColor(feed.risk_level)}`}>
                  {feed.risk_level.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-sm font-bold text-primary-400">
                  {feed.matches.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-red-400">
                  {feed.blocked_queries.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Blocked</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${getAccuracyColor(feed.accuracy_rate)}`}>
                  {feed.accuracy_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-300">
                  {feed.blocked_queries > 0 ? ((feed.blocked_queries / feed.matches) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-xs text-gray-400">Block Rate</div>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Categories:</div>
              <div className="flex flex-wrap gap-1">
                {feed.categories.slice(0, 4).map((category, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                  >
                    {category}
                  </span>
                ))}
                {feed.categories.length > 4 && (
                  <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
                    +{feed.categories.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Last updated: {new Date(feed.last_updated).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span>
                  {feed.trend === 'up' ? 'Increasing' : feed.trend === 'down' ? 'Decreasing' : 'Stable'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feed Performance Summary */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Feed Performance</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="text-gray-400">
            <span className="text-green-400">Most Active:</span> {sortedFeeds[0]?.feed_name || 'N/A'}
          </div>
          <div className="text-gray-400">
            <span className="text-blue-400">Highest Accuracy:</span> {
              [...data].sort((a, b) => b.accuracy_rate - a.accuracy_rate)[0]?.feed_name || 'N/A'
            }
          </div>
          <div className="text-gray-400">
            <span className="text-red-400">Most Blocks:</span> {
              [...data].sort((a, b) => b.blocked_queries - a.blocked_queries)[0]?.feed_name || 'N/A'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

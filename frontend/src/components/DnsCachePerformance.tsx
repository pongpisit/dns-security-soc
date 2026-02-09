import React from 'react'
import { Zap, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface CachePerformanceData {
  status: string
  queries: number
  percentage: number
  avg_response_time: number
  trend: 'up' | 'down' | 'stable'
}

interface CacheMetrics {
  hit_rate: number
  miss_rate: number
  total_queries: number
  avg_hit_time: number
  avg_miss_time: number
  performance_score: number
}

interface DnsCachePerformanceProps {
  data: CachePerformanceData[]
  metrics: CacheMetrics
  timeSeriesData?: Array<{ timestamp: string; hit_rate: number; response_time: number }>
  isLoading?: boolean
  className?: string
}

export function DnsCachePerformance({ 
  data, 
  metrics, 
  timeSeriesData, 
  isLoading, 
  className = '' 
}: DnsCachePerformanceProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">DNS Cache Performance</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Zap className="h-4 w-4 mr-1" />
            <span>Cache efficiency</span>
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
          <h3 className="card-title">DNS Cache Performance</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Zap className="h-4 w-4 mr-1" />
            <span>Cache efficiency</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No cache data available</p>
          </div>
        </div>
      </div>
    )
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-blue-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hit':
        return '#10b981' // green
      case 'miss':
        return '#f59e0b' // amber
      case 'stale':
        return '#6b7280' // gray
      default:
        return '#ef4444' // red
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.status}</p>
          <p className="text-gray-300">
            <span className="text-primary-400">{data.queries.toLocaleString()}</span> queries
          </p>
          <p className="text-gray-300">
            <span className="text-primary-400">{data.percentage.toFixed(1)}%</span> of total
          </p>
          <p className="text-gray-300">
            Avg response: <span className="text-primary-400">{data.avg_response_time}ms</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">DNS Cache Performance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Zap className="h-4 w-4 mr-1" />
            <span>Cache efficiency</span>
          </div>
          <div className={`text-sm font-medium ${getPerformanceColor(metrics.performance_score)}`}>
            Score: {metrics.performance_score}/100
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {metrics.hit_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Hit Rate</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-amber-400">
            {metrics.miss_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Miss Rate</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {metrics.avg_hit_time}ms
          </div>
          <div className="text-xs text-gray-400">Avg Hit Time</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {metrics.avg_miss_time}ms
          </div>
          <div className="text-xs text-gray-400">Avg Miss Time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Status Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Cache Status Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="status" 
                  stroke="#9ca3af" 
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="queries" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cache Status Details */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Status Breakdown</h4>
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{item.status}</div>
                    <div className="text-xs text-gray-400">
                      Avg: {item.avg_response_time}ms
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(item.trend)}
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {item.queries.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Series Chart (if available) */}
      {timeSeriesData && timeSeriesData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Cache Performance Trend</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af" 
                  fontSize={10}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: any, name: string) => [
                    `${value}${name === 'hit_rate' ? '%' : 'ms'}`,
                    name === 'hit_rate' ? 'Hit Rate' : 'Response Time'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="hit_rate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="response_time" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="h-4 w-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Performance Insights</span>
        </div>
        <div className="text-xs text-gray-400">
          {metrics.hit_rate >= 80 ? (
            <span className="text-green-400">✓ Excellent cache performance - hit rate above 80%</span>
          ) : metrics.hit_rate >= 60 ? (
            <span className="text-amber-400">⚠ Good cache performance - consider cache optimization</span>
          ) : (
            <span className="text-red-400">⚠ Poor cache performance - cache tuning recommended</span>
          )}
        </div>
      </div>
    </div>
  )
}

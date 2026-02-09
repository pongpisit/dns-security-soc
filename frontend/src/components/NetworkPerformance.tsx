import React from 'react'
import { Wifi, Zap, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface NetworkMetrics {
  timestamp: string
  avg_response_time: number
  queries_per_second: number
  cache_hit_rate: number
  error_rate: number
  bandwidth_usage: number
  concurrent_connections: number
}

interface PerformanceStats {
  current_qps: number
  peak_qps: number
  avg_response_time: number
  uptime_percentage: number
  total_bandwidth: number
  performance_score: number
  trend: 'improving' | 'degrading' | 'stable'
}

interface NetworkPerformanceProps {
  timeSeriesData: NetworkMetrics[]
  stats: PerformanceStats
  isLoading?: boolean
  className?: string
}

export function NetworkPerformance({ 
  timeSeriesData, 
  stats, 
  isLoading, 
  className = '' 
}: NetworkPerformanceProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">Network Performance</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Wifi className="h-4 w-4 mr-1" />
            <span>Real-time metrics</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">Network Performance</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Wifi className="h-4 w-4 mr-1" />
            <span>Real-time metrics</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No performance data available</p>
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const formatBandwidth = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">
            {new Date(label).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-gray-300">
              <span style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
              {entry.dataKey === 'avg_response_time' && 'ms'}
              {entry.dataKey === 'queries_per_second' && ' QPS'}
              {entry.dataKey === 'cache_hit_rate' && '%'}
              {entry.dataKey === 'error_rate' && '%'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">Network Performance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Wifi className="h-4 w-4 mr-1" />
            <span>Real-time metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon(stats.trend)}
            <span className={`text-sm font-medium ${getPerformanceColor(stats.performance_score)}`}>
              Score: {stats.performance_score}/100
            </span>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-primary-400">
            {stats.current_qps.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Current QPS</div>
          <div className="text-xs text-gray-500">
            Peak: {stats.peak_qps.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${stats.avg_response_time < 50 ? 'text-green-400' : stats.avg_response_time < 100 ? 'text-amber-400' : 'text-red-400'}`}>
            {stats.avg_response_time}ms
          </div>
          <div className="text-xs text-gray-400">Avg Response</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${stats.uptime_percentage >= 99.9 ? 'text-green-400' : stats.uptime_percentage >= 99 ? 'text-amber-400' : 'text-red-400'}`}>
            {stats.uptime_percentage.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">Uptime</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {formatBandwidth(stats.total_bandwidth)}
          </div>
          <div className="text-xs text-gray-400">Bandwidth</div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time & QPS */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Response Time & Query Rate</h4>
          <div className="h-48">
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
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avg_response_time" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Response Time"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="queries_per_second" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="QPS"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cache Hit Rate & Error Rate */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Cache Performance & Errors</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
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
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cache_hit_rate" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Cache Hit Rate"
                />
                <Area 
                  type="monotone" 
                  dataKey="error_rate" 
                  stackId="2"
                  stroke="#ef4444" 
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Error Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Load */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-gray-300">Current Load</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Queries/sec:</span>
              <span className="text-white font-medium">{stats.current_qps.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Connections:</span>
              <span className="text-white font-medium">
                {timeSeriesData[timeSeriesData.length - 1]?.concurrent_connections || 0}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Bandwidth:</span>
              <span className="text-white font-medium">
                {formatBandwidth(timeSeriesData[timeSeriesData.length - 1]?.bandwidth_usage || 0)}/s
              </span>
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Trends</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Response Time:</span>
              <span className={`font-medium ${stats.trend === 'improving' ? 'text-green-400' : stats.trend === 'degrading' ? 'text-red-400' : 'text-gray-300'}`}>
                {stats.trend === 'improving' ? '↓ Improving' : stats.trend === 'degrading' ? '↑ Degrading' : '→ Stable'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Cache Hit Rate:</span>
              <span className="text-green-400 font-medium">
                {timeSeriesData[timeSeriesData.length - 1]?.cache_hit_rate.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Error Rate:</span>
              <span className={`font-medium ${(timeSeriesData[timeSeriesData.length - 1]?.error_rate || 0) < 1 ? 'text-green-400' : 'text-red-400'}`}>
                {timeSeriesData[timeSeriesData.length - 1]?.error_rate.toFixed(2) || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-gray-300">System Health</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Performance:</span>
              <span className={`font-medium ${getPerformanceColor(stats.performance_score)}`}>
                {stats.performance_score >= 90 ? 'Excellent' : 
                 stats.performance_score >= 70 ? 'Good' : 
                 stats.performance_score >= 50 ? 'Fair' : 'Poor'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Uptime:</span>
              <span className={`font-medium ${stats.uptime_percentage >= 99.9 ? 'text-green-400' : 'text-amber-400'}`}>
                {stats.uptime_percentage.toFixed(3)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400 font-medium">
                {stats.performance_score >= 70 ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-4 w-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Performance Insights</span>
        </div>
        <div className="text-xs text-gray-400">
          {stats.performance_score >= 90 ? (
            <span className="text-green-400">✓ System performing optimally with excellent response times</span>
          ) : stats.performance_score >= 70 ? (
            <span className="text-blue-400">ℹ Good performance - monitor for optimization opportunities</span>
          ) : stats.performance_score >= 50 ? (
            <span className="text-amber-400">⚠ Performance degradation detected - investigate bottlenecks</span>
          ) : (
            <span className="text-red-400">⚠ Critical performance issues - immediate attention required</span>
          )}
        </div>
      </div>
    </div>
  )
}

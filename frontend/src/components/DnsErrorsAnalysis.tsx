import React from 'react'
import { AlertCircle, XCircle, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DnsErrorData {
  error_code: string
  error_name: string
  count: number
  percentage: number
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  description: string
  trend: 'up' | 'down' | 'stable'
  affected_domains: string[]
  resolution_suggestions: string[]
}

interface ErrorMetrics {
  total_errors: number
  error_rate: number
  most_common_error: string
  critical_errors: number
  trend_direction: 'improving' | 'degrading' | 'stable'
}

interface DnsErrorsAnalysisProps {
  data: DnsErrorData[]
  metrics: ErrorMetrics
  timeSeriesData?: Array<{ timestamp: string; error_count: number; error_rate: number }>
  isLoading?: boolean
  className?: string
}

const ERROR_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#eab308',
  info: '#3b82f6'
}

export function DnsErrorsAnalysis({ 
  data, 
  metrics, 
  timeSeriesData, 
  isLoading, 
  className = '' 
}: DnsErrorsAnalysisProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">DNS Errors Analysis</h3>
          <div className="flex items-center text-sm text-gray-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Error diagnostics</span>
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
          <h3 className="card-title">DNS Errors Analysis</h3>
          <div className="flex items-center text-sm text-gray-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Error diagnostics</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No DNS errors detected</p>
            <p className="text-xs mt-2">System operating normally</p>
          </div>
        </div>
      </div>
    )
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <AlertCircle className="h-4 w-4" />
      case 'low':
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'medium':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'low':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'info':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-400" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-400" />
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'improving':
        return 'text-green-400'
      case 'degrading':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const chartData = data.map(item => ({
    ...item,
    name: item.error_name,
    value: item.count,
    fill: ERROR_COLORS[item.severity as keyof typeof ERROR_COLORS]
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-medium">{data.error_name}</p>
          <p className="text-gray-300 text-sm">Code: {data.error_code}</p>
          <p className="text-gray-300">
            <span className="text-primary-400">{data.count.toLocaleString()}</span> occurrences
          </p>
          <p className="text-gray-300">
            <span className="text-primary-400">{data.percentage.toFixed(1)}%</span> of total errors
          </p>
          <p className="text-gray-400 text-xs mt-1">{data.description}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">DNS Errors Analysis</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Error diagnostics</span>
          </div>
          <div className={`text-sm font-medium ${getTrendColor(metrics.trend_direction)}`}>
            {metrics.trend_direction.charAt(0).toUpperCase() + metrics.trend_direction.slice(1)}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {metrics.total_errors.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Total Errors</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-amber-400">
            {metrics.error_rate.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">Error Rate</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-400">
            {metrics.critical_errors}
          </div>
          <div className="text-xs text-gray-400">Critical</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {data.length}
          </div>
          <div className="text-xs text-gray-400">Error Types</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Distribution Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Error Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Errors Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Most Common Errors</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="error_code" 
                  stroke="#9ca3af" 
                  fontSize={10}
                />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#ef4444"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Error List */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Error Details</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.slice(0, 8).map((error) => (
            <div key={error.error_code} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded border ${getSeverityColor(error.severity)}`}>
                    {getSeverityIcon(error.severity)}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-white">{error.error_name}</h5>
                    <p className="text-xs text-gray-400">Code: {error.error_code}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(error.trend)}
                  <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(error.severity)}`}>
                    {error.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <span className="text-xs text-gray-400">Occurrences: </span>
                  <span className="text-sm font-medium text-white">{error.count.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Percentage: </span>
                  <span className="text-sm font-medium text-white">{error.percentage.toFixed(1)}%</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-2">{error.description}</p>

              {error.affected_domains.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-gray-400">Affected domains: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {error.affected_domains.slice(0, 3).map((domain, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                        {domain}
                      </span>
                    ))}
                    {error.affected_domains.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
                        +{error.affected_domains.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {error.resolution_suggestions.length > 0 && (
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                  <div className="text-xs text-blue-400 font-medium mb-1">Resolution Suggestions:</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {error.resolution_suggestions.slice(0, 2).map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Health Indicator */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-primary-400" />
            <span className="text-sm font-medium text-gray-300">System Health</span>
          </div>
          <div className="text-xs text-gray-400">
            {metrics.error_rate < 1 ? (
              <span className="text-green-400">✓ Healthy - Low error rate</span>
            ) : metrics.error_rate < 5 ? (
              <span className="text-amber-400">⚠ Monitor - Elevated errors</span>
            ) : (
              <span className="text-red-400">⚠ Critical - High error rate</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

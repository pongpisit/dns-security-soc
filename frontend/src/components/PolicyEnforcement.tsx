import React from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, Settings } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PolicyData {
  policy_id: string
  policy_name: string
  total_queries: number
  blocked_queries: number
  allowed_queries: number
  block_rate: number
  categories_covered: string[]
  enforcement_status: 'active' | 'inactive' | 'testing'
  last_updated: string
  effectiveness_score: number
  trend: 'up' | 'down' | 'stable'
}

interface PolicyMetrics {
  total_policies: number
  active_policies: number
  overall_block_rate: number
  total_enforcement_actions: number
  avg_effectiveness: number
  policy_coverage: number
}

interface PolicyEnforcementProps {
  data: PolicyData[]
  metrics: PolicyMetrics
  isLoading?: boolean
  className?: string
}

const ENFORCEMENT_COLORS = {
  blocked: '#ef4444',
  allowed: '#10b981',
  testing: '#f59e0b'
}

export function PolicyEnforcement({ 
  data, 
  metrics, 
  isLoading, 
  className = '' 
}: PolicyEnforcementProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">Policy Enforcement</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Shield className="h-4 w-4 mr-1" />
            <span>Security policies</span>
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
          <h3 className="card-title">Policy Enforcement</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Shield className="h-4 w-4 mr-1" />
            <span>Security policies</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No policy data available</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'inactive':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'testing':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'inactive':
        return <XCircle className="h-4 w-4" />
      case 'testing':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getEffectivenessColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-blue-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-400" />
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />
    }
  }

  // Sort policies by effectiveness score
  const sortedPolicies = [...data].sort((a, b) => b.effectiveness_score - a.effectiveness_score)

  // Prepare chart data
  const chartData = data.map(policy => ({
    name: policy.policy_name.length > 15 ? policy.policy_name.substring(0, 15) + '...' : policy.policy_name,
    blocked: policy.blocked_queries,
    allowed: policy.allowed_queries,
    total: policy.total_queries
  }))

  const pieData = [
    { name: 'Blocked', value: data.reduce((sum, p) => sum + p.blocked_queries, 0), fill: ENFORCEMENT_COLORS.blocked },
    { name: 'Allowed', value: data.reduce((sum, p) => sum + p.allowed_queries, 0), fill: ENFORCEMENT_COLORS.allowed }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-gray-300">
              <span style={{ color: entry.color }}>{entry.dataKey}:</span> {entry.value.toLocaleString()}
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
        <h3 className="card-title">Policy Enforcement</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Shield className="h-4 w-4 mr-1" />
            <span>{metrics.active_policies}/{metrics.total_policies} active</span>
          </div>
          <div className="text-sm font-medium text-primary-400">
            {metrics.overall_block_rate.toFixed(1)}% block rate
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {metrics.active_policies}
          </div>
          <div className="text-xs text-gray-400">Active Policies</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {metrics.total_enforcement_actions.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Actions</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${getEffectivenessColor(metrics.avg_effectiveness)}`}>
            {metrics.avg_effectiveness.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Effectiveness</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {metrics.policy_coverage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Coverage</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enforcement Actions Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Enforcement Actions</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value.toLocaleString(), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Policy Performance Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Policy Performance</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="blocked" fill={ENFORCEMENT_COLORS.blocked} />
                <Bar dataKey="allowed" fill={ENFORCEMENT_COLORS.allowed} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Policy Details</h4>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {sortedPolicies.slice(0, 8).map((policy) => (
            <div key={policy.policy_id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded border ${getStatusColor(policy.enforcement_status)}`}>
                    {getStatusIcon(policy.enforcement_status)}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-white">{policy.policy_name}</h5>
                    <p className="text-xs text-gray-400">ID: {policy.policy_id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(policy.trend)}
                  <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(policy.enforcement_status)}`}>
                    {policy.enforcement_status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-sm font-bold text-primary-400">
                    {policy.total_queries.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Total Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-red-400">
                    {policy.blocked_queries.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Blocked</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-green-400">
                    {policy.allowed_queries.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Allowed</div>
                </div>
                <div className="text-center">
                  <div className={`text-sm font-bold ${getEffectivenessColor(policy.effectiveness_score)}`}>
                    {policy.effectiveness_score.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Effectiveness</div>
                </div>
              </div>

              {/* Block Rate Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Block Rate</span>
                  <span>{policy.block_rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(policy.block_rate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Categories Covered */}
              {policy.categories_covered.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Categories covered:</div>
                  <div className="flex flex-wrap gap-1">
                    {policy.categories_covered.slice(0, 4).map((category, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                      >
                        {category}
                      </span>
                    ))}
                    {policy.categories_covered.length > 4 && (
                      <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
                        +{policy.categories_covered.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Updated: {new Date(policy.last_updated).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>
                    {policy.trend === 'up' ? 'More effective' : policy.trend === 'down' ? 'Less effective' : 'Stable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Insights */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Policy Insights</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="text-gray-400">
            <span className="text-green-400">Most Effective:</span> {
              sortedPolicies[0]?.policy_name || 'N/A'
            }
          </div>
          <div className="text-gray-400">
            <span className="text-red-400">Most Active:</span> {
              [...data].sort((a, b) => b.total_queries - a.total_queries)[0]?.policy_name || 'N/A'
            }
          </div>
          <div className="text-gray-400">
            <span className="text-blue-400">Coverage Status:</span> {
              metrics.policy_coverage >= 90 ? 'Comprehensive' :
              metrics.policy_coverage >= 70 ? 'Good coverage' :
              'Needs improvement'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

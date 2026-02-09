import React from 'react'
import { Shield, Wifi, Lock, Globe } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface DnsProtocolData {
  protocol: string
  queries: number
  percentage: number
  security_level: 'high' | 'medium' | 'standard'
}

interface DnsProtocolUsageProps {
  data: DnsProtocolData[]
  isLoading?: boolean
  className?: string
}

const PROTOCOL_COLORS = {
  'DNS-over-HTTPS': '#10b981', // green
  'DNS-over-TLS': '#3b82f6',   // blue
  'Standard DNS': '#f59e0b',   // amber
  'Unknown': '#6b7280'         // gray
}

const PROTOCOL_ICONS = {
  'DNS-over-HTTPS': Lock,
  'DNS-over-TLS': Shield,
  'Standard DNS': Wifi,
  'Unknown': Globe
}

export function DnsProtocolUsage({ data, isLoading, className = '' }: DnsProtocolUsageProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">DNS Protocol Usage</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Lock className="h-4 w-4 mr-1" />
            <span>Security protocols</span>
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
          <h3 className="card-title">DNS Protocol Usage</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Lock className="h-4 w-4 mr-1" />
            <span>Security protocols</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No protocol data available</p>
          </div>
        </div>
      </div>
    )
  }

  const totalQueries = data.reduce((sum, item) => sum + item.queries, 0)
  const chartData = data.map(item => ({
    ...item,
    name: item.protocol,
    value: item.queries,
    fill: PROTOCOL_COLORS[item.protocol as keyof typeof PROTOCOL_COLORS] || PROTOCOL_COLORS.Unknown
  }))

  const getSecurityBadge = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.protocol}</p>
          <p className="text-gray-300">
            <span className="text-primary-400">{data.queries.toLocaleString()}</span> queries
          </p>
          <p className="text-gray-300">
            <span className="text-primary-400">{data.percentage.toFixed(1)}%</span> of total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">DNS Protocol Usage</h3>
        <div className="flex items-center text-sm text-gray-400">
          <Lock className="h-4 w-4 mr-1" />
          <span>Security protocols</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
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

        {/* Protocol Details */}
        <div className="space-y-3">
          {data.map((protocol) => {
            const IconComponent = PROTOCOL_ICONS[protocol.protocol as keyof typeof PROTOCOL_ICONS] || Globe
            const percentage = totalQueries > 0 ? (protocol.queries / totalQueries) * 100 : 0
            
            return (
              <div key={protocol.protocol} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-white">{protocol.protocol}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getSecurityBadge(protocol.security_level)}`}>
                        {protocol.security_level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {protocol.queries.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">
              {data.filter(p => p.security_level === 'high').reduce((sum, p) => sum + p.queries, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Secure Queries</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary-400">
              {totalQueries.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total Queries</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400">
              {data.filter(p => p.security_level === 'standard').reduce((sum, p) => sum + p.queries, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Standard DNS</div>
          </div>
        </div>
      </div>
    </div>
  )
}

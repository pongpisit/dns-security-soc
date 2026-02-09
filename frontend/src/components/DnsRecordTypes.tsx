import React from 'react'
import { FileText, TrendingUp } from 'lucide-react'

interface DnsRecordTypesProps {
  data: any[]
  isLoading?: boolean
}

export function DnsRecordTypes({ data, isLoading }: DnsRecordTypesProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">DNS Record Types</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  // Aggregate by record type
  const recordTypeCounts = data.reduce((acc, item) => {
    const types = item.query_type ? [item.query_type] : (item.resource_record_types || [])
    types.forEach((type: string) => {
      if (type) {
        acc[type] = (acc[type] || 0) + (item.count || 1)
      }
    })
    return acc
  }, {} as Record<string, number>)

  const total = Object.values(recordTypeCounts).reduce((sum: number, count: number) => sum + count, 0)

  const sortedTypes = Object.entries(recordTypeCounts)
    .map(([type, count]: [string, number]) => ({
      type,
      count,
      percentage: total > 0 ? (Number(count) / Number(total)) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'A': return 'blue'
      case 'AAAA': return 'purple'
      case 'CNAME': return 'green'
      case 'MX': return 'yellow'
      case 'TXT': return 'orange'
      case 'NS': return 'pink'
      case 'SOA': return 'indigo'
      case 'PTR': return 'cyan'
      case 'SRV': return 'teal'
      case 'HTTPS': return 'red'
      default: return 'gray'
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">DNS Record Types</h3>
        <div className="flex items-center text-sm text-gray-400">
          <FileText className="h-4 w-4 mr-1" />
          <span>Query distribution</span>
        </div>
      </div>

      {sortedTypes.length > 0 ? (
        <div className="space-y-3">
          {sortedTypes.map(({ type, count, percentage }) => {
            const color = getRecordTypeColor(type)
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
                    <span className="text-sm font-medium text-gray-300">{type}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-white">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}

          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Queries</span>
              <span className="text-white font-medium">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <FileText className="h-12 w-12 text-gray-600 mb-3" />
          <p className="text-gray-400">No DNS record type data available</p>
        </div>
      )}
    </div>
  )
}

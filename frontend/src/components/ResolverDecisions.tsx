import React from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ResolverDecisionsProps {
  data: any[]
  isLoading?: boolean
}

const RESOLVER_DECISIONS = {
  0: { name: 'Unknown', color: 'gray', icon: AlertTriangle },
  1: { name: 'Allowed by Query Name', color: 'green', icon: CheckCircle },
  2: { name: 'Blocked by Query Name', color: 'red', icon: XCircle },
  3: { name: 'Blocked by Category', color: 'red', icon: XCircle },
  4: { name: 'Allowed (No Location)', color: 'green', icon: CheckCircle },
  5: { name: 'Allowed (No Policy Match)', color: 'green', icon: CheckCircle },
  6: { name: 'Blocked (Always Category)', color: 'red', icon: XCircle },
  7: { name: 'Override (SafeSearch)', color: 'yellow', icon: Shield },
  8: { name: 'Override Applied', color: 'yellow', icon: Shield },
  9: { name: 'Blocked by Rule', color: 'red', icon: XCircle },
  10: { name: 'Allowed by Rule', color: 'green', icon: CheckCircle },
}

export function ResolverDecisions({ data, isLoading }: ResolverDecisionsProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Resolver Decisions</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  // Aggregate by resolver decision
  const decisionCounts = data.reduce((acc, item) => {
    const decision = item.resolver_decision || '5'
    acc[decision] = (acc[decision] || 0) + (item.count || 1)
    return acc
  }, {} as Record<string, number>)

  const total = Object.values(decisionCounts).reduce((sum: number, count: number) => sum + count, 0)

  const sortedDecisions = Object.entries(decisionCounts)
    .map(([decision, count]: [string, number]) => ({
      decision: parseInt(decision),
      count,
      percentage: total > 0 ? (Number(count) / Number(total)) * 100 : 0,
      info: RESOLVER_DECISIONS[parseInt(decision) as keyof typeof RESOLVER_DECISIONS] || RESOLVER_DECISIONS[0]
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Resolver Decisions</h3>
        <div className="flex items-center text-sm text-gray-400">
          <Shield className="h-4 w-4 mr-1" />
          <span>Policy enforcement</span>
        </div>
      </div>

      {sortedDecisions.length > 0 ? (
        <div className="space-y-3">
          {sortedDecisions.map(({ decision, count, percentage, info }) => {
            const Icon = info.icon
            return (
              <div key={decision} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 text-${info.color}-400`} />
                    <span className="text-sm text-gray-300">{info.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-white">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`bg-${info.color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}

          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Decisions</span>
              <span className="text-white font-medium">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Shield className="h-12 w-12 text-gray-600 mb-3" />
          <p className="text-gray-400">No resolver decision data available</p>
        </div>
      )}
    </div>
  )
}

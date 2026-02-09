import React from 'react'
import { Shield, Activity, CheckCircle, XCircle } from 'lucide-react'

interface PolicyEnforcementRealProps {
  data: any[]
  isLoading?: boolean
}

export function PolicyEnforcementReal({ data, isLoading }: PolicyEnforcementRealProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Policy Enforcement</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  // Aggregate by policy name
  const policyStats = data.reduce((acc, item) => {
    const policyName = item.policy_name || 'No Policy'
    if (!acc[policyName]) {
      acc[policyName] = {
        name: policyName,
        total: 0,
        blocked: 0,
        allowed: 0
      }
    }
    const count = item.count || 1
    acc[policyName].total += count
    if (item.blocked || item.resolver_decision === '2' || item.resolver_decision === '3' || item.resolver_decision === '9') {
      acc[policyName].blocked += count
    } else {
      acc[policyName].allowed += count
    }
    return acc
  }, {} as Record<string, any>)

  const sortedPolicies = Object.values(policyStats)
    .map((policy: any) => ({
      ...policy,
      blockRate: policy.total > 0 ? (policy.blocked / policy.total) * 100 : 0
    }))
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 10)

  const totalQueries = sortedPolicies.reduce((sum: number, p: any) => sum + p.total, 0)
  const totalBlocked = sortedPolicies.reduce((sum: number, p: any) => sum + p.blocked, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Policy Enforcement</h3>
        <div className="flex items-center text-sm text-gray-400">
          <Shield className="h-4 w-4 mr-1" />
          <span>Real policy data</span>
        </div>
      </div>

      {sortedPolicies.length > 0 ? (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-gray-400">Total Queries</div>
              <div className="text-lg font-bold text-white">{totalQueries.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Blocked</div>
              <div className="text-lg font-bold text-red-400">{totalBlocked.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Block Rate</div>
              <div className="text-lg font-bold text-yellow-400">
                {totalQueries > 0 ? ((totalBlocked / totalQueries) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          {/* Policy List */}
          <div className="space-y-3">
            {sortedPolicies.map((policy: any, index: number) => (
              <div key={index} className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary-400" />
                    <span className="text-sm font-medium text-white truncate max-w-[200px]">
                      {policy.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {policy.total.toLocaleString()} queries
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-gray-400">{policy.allowed.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <XCircle className="h-3 w-3 text-red-400" />
                      <span className="text-gray-400">{policy.blocked.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`font-medium ${policy.blockRate > 50 ? 'text-red-400' : policy.blockRate > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {policy.blockRate.toFixed(1)}% blocked
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${policy.blockRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Shield className="h-12 w-12 text-gray-600 mb-3" />
          <p className="text-gray-400">No policy enforcement data available</p>
        </div>
      )}
    </div>
  )
}

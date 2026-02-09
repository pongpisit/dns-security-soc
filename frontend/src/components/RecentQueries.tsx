import React from 'react'
import { Shield, AlertTriangle, Globe, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { DNSQuery } from '../services/api'

interface RecentQueriesProps {
  data: DNSQuery[]
}

export function RecentQueries({ data }: RecentQueriesProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="text-center">
          <div className="text-lg mb-2">No recent queries</div>
          <div className="text-sm">DNS queries will appear here in real-time</div>
        </div>
      </div>
    )
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'text-danger-400'
    if (riskScore >= 50) return 'text-warning-400'
    if (riskScore >= 20) return 'text-yellow-400'
    return 'text-success-400'
  }

  const getRiskBadge = (riskScore: number, blocked: boolean) => {
    if (blocked) {
      return <span className="status-critical">BLOCKED</span>
    }
    if (riskScore >= 80) return <span className="status-critical">HIGH RISK</span>
    if (riskScore >= 50) return <span className="status-warning">MEDIUM RISK</span>
    if (riskScore >= 20) return <span className="status-warning">LOW RISK</span>
    return <span className="status-healthy">SAFE</span>
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {data.map((query) => (
        <div 
          key={query.id} 
          className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {query.blocked ? (
                <Shield className="h-5 w-5 text-danger-400" />
              ) : query.risk_score > 50 ? (
                <AlertTriangle className="h-5 w-5 text-warning-400" />
              ) : (
                <Globe className="h-5 w-5 text-success-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white truncate">
                  {query.query_name}
                </p>
                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                  {query.query_type}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center text-xs text-gray-400">
                  <Globe className="h-3 w-3 mr-1" />
                  <span>{query.source_ip}</span>
                </div>
                
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{format(new Date(query.timestamp), 'HH:mm:ss')}</span>
                </div>
                
                {query.location && (
                  <div className="text-xs text-gray-400">
                    📍 {query.location}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="text-right">
              <div className={`text-sm font-medium ${getRiskColor(query.risk_score)}`}>
                {query.risk_score}
              </div>
              <div className="text-xs text-gray-400">Risk Score</div>
            </div>
            
            {getRiskBadge(query.risk_score, query.blocked)}
          </div>
        </div>
      ))}
    </div>
  )
}

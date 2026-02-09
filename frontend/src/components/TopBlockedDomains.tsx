import React from 'react'
import { Shield, AlertTriangle, Ban, Globe } from 'lucide-react'
import { BlockedQuery } from '../services/api'

interface TopBlockedDomainsProps {
  data: BlockedQuery[]
  isLoading?: boolean
}

export function TopBlockedDomains({ data, isLoading }: TopBlockedDomainsProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top Blocked Domains</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Shield className="h-4 w-4 mr-1" />
            <span>Security threats</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-danger-500"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top Blocked Domains</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Shield className="h-4 w-4 mr-1" />
            <span>Security threats</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50 text-success-400" />
            <div className="text-lg mb-2 text-success-400">All Clear!</div>
            <div className="text-sm">No blocked domains detected</div>
            <div className="text-xs mt-1">Your DNS security is working perfectly</div>
          </div>
        </div>
      </div>
    )
  }

  // Get risk level color and icon
  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 80) return { 
      level: 'Critical', 
      color: 'text-red-400', 
      bgColor: 'bg-red-900/30', 
      borderColor: 'border-red-600',
      icon: '🚨'
    }
    if (riskScore >= 60) return { 
      level: 'High', 
      color: 'text-orange-400', 
      bgColor: 'bg-orange-900/30', 
      borderColor: 'border-orange-600',
      icon: '⚠️'
    }
    if (riskScore >= 40) return { 
      level: 'Medium', 
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-900/30', 
      borderColor: 'border-yellow-600',
      icon: '⚡'
    }
    return { 
      level: 'Low', 
      color: 'text-blue-400', 
      bgColor: 'bg-blue-900/30', 
      borderColor: 'border-blue-600',
      icon: '🔍'
    }
  }

  // Get country flag
  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'TH': '🇹🇭', 'SG': '🇸🇬', 'US': '🇺🇸', 'JP': '🇯🇵',
      'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'CA': '🇨🇦',
      'AU': '🇦🇺', 'CN': '🇨🇳', 'RU': '🇷🇺', 'IN': '🇮🇳'
    }
    return flags[country] || '🌍'
  }

  // Get resolver decision description
  const getResolverDecision = (decision: string) => {
    // Based on common DNS resolver decision codes
    switch (decision) {
      case '1': return 'Allowed'
      case '2': return 'Blocked - Policy'
      case '3': return 'Blocked - Category'
      case '4': return 'Blocked - Threat'
      case '5': return 'Blocked - Malware'
      case '6': return 'Blocked - Phishing'
      case '7': return 'Blocked - Botnet'
      case '8': return 'Blocked - Spam'
      case '9': return 'Blocked - Security'
      default: return `Code ${decision}`
    }
  }

  const totalBlocked = data.reduce((sum, item) => sum + item.blocked_count, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Top Blocked Domains</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Shield className="h-4 w-4 mr-1" />
            <span>Security threats</span>
          </div>
          <div className="text-sm text-danger-400 font-medium">
            {totalBlocked.toLocaleString()} total blocks
          </div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {data.slice(0, 10).map((item, index) => {
          const risk = getRiskLevel(item.risk_score)
          const percentage = totalBlocked > 0 ? (item.blocked_count / totalBlocked) * 100 : 0
          
          return (
            <div 
              key={`${item.domain}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${risk.bgColor} ${risk.borderColor} hover:bg-opacity-50 transition-colors`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 text-sm font-medium text-gray-400 w-6">
                  #{index + 1}
                </div>
                <div className="text-lg flex-shrink-0">
                  {risk.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-white truncate">
                      {item.domain}
                    </div>
                    <div className="text-xs">
                      {getCountryFlag(item.country)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span className={risk.color}>
                      {risk.level} Risk ({item.risk_score})
                    </span>
                    <span>•</span>
                    <span>{percentage.toFixed(1)}% of blocks</span>
                    <span>•</span>
                    <span className="text-danger-400">
                      {getResolverDecision(item.resolver_decision)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-medium text-danger-400">
                  {item.blocked_count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  blocks
                </div>
                <div className={`text-xs mt-1 ${risk.color}`}>
                  Risk: {item.risk_score}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <Ban className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No blocked domains</div>
          </div>
        </div>
      )}
    </div>
  )
}

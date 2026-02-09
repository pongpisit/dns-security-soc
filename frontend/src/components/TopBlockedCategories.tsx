import React from 'react'
import { Shield, AlertTriangle, Ban, Target } from 'lucide-react'
import { BlockedQuery } from '../services/api'

interface TopBlockedCategoriesProps {
  data: BlockedQuery[]
  isLoading?: boolean
}

export function TopBlockedCategories({ data, isLoading }: TopBlockedCategoriesProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top Blocked Categories</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Target className="h-4 w-4 mr-1" />
            <span>Threat categories</span>
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
          <h3 className="card-title">Top Blocked Categories</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Target className="h-4 w-4 mr-1" />
            <span>Threat categories</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50 text-success-400" />
            <div className="text-lg mb-2 text-success-400">All Clear!</div>
            <div className="text-sm">No blocked categories detected</div>
            <div className="text-xs mt-1">Your security policies are working perfectly</div>
          </div>
        </div>
      </div>
    )
  }

  // Categorize blocked domains by threat type and domain characteristics
  const categorizeBlockedDomain = (domain: string, riskScore: number, resolverDecision: string): string => {
    const lowerDomain = domain.toLowerCase()
    
    // Based on resolver decision first
    switch (resolverDecision) {
      case '5': return 'Malware'
      case '6': return 'Phishing'
      case '7': return 'Botnet'
      case '8': return 'Spam'
      case '9': return 'Security Policy'
      case '3': return 'Content Category'
      case '4': return 'Known Threat'
    }
    
    // Domain-based categorization
    if (lowerDomain.includes('malware') || lowerDomain.includes('virus') || 
        lowerDomain.includes('trojan') || lowerDomain.includes('ransomware')) {
      return 'Malware'
    }
    
    if (lowerDomain.includes('phish') || lowerDomain.includes('fake') || 
        lowerDomain.includes('scam') || lowerDomain.includes('fraud')) {
      return 'Phishing'
    }
    
    if (lowerDomain.includes('bot') || lowerDomain.includes('c2') || 
        lowerDomain.includes('command') || lowerDomain.includes('control')) {
      return 'Botnet'
    }
    
    if (lowerDomain.includes('ad') || lowerDomain.includes('ads') || 
        lowerDomain.includes('tracker') || lowerDomain.includes('analytics')) {
      return 'Advertising/Tracking'
    }
    
    if (lowerDomain.includes('adult') || lowerDomain.includes('porn') || 
        lowerDomain.includes('xxx') || lowerDomain.includes('sex')) {
      return 'Adult Content'
    }
    
    if (lowerDomain.includes('gambling') || lowerDomain.includes('casino') || 
        lowerDomain.includes('poker') || lowerDomain.includes('bet')) {
      return 'Gambling'
    }
    
    if (lowerDomain.includes('social') || lowerDomain.includes('facebook') || 
        lowerDomain.includes('twitter') || lowerDomain.includes('instagram')) {
      return 'Social Media'
    }
    
    if (lowerDomain.includes('game') || lowerDomain.includes('gaming') || 
        lowerDomain.includes('steam') || lowerDomain.includes('xbox')) {
      return 'Gaming'
    }
    
    if (lowerDomain.includes('crypto') || lowerDomain.includes('bitcoin') || 
        lowerDomain.includes('mining') || lowerDomain.includes('blockchain')) {
      return 'Cryptocurrency'
    }
    
    // Risk score based categorization
    if (riskScore >= 80) return 'High Risk'
    if (riskScore >= 60) return 'Suspicious Activity'
    if (riskScore >= 40) return 'Policy Violation'
    
    return 'Other Security'
  }

  // Process categories
  const categoryStats: Record<string, { 
    blocked_count: number
    domains: Set<string>
    avg_risk: number
    total_risk: number
    countries: Set<string>
    decisions: string[]
  }> = {}

  data.forEach(item => {
    const category = categorizeBlockedDomain(item.domain, item.risk_score, item.resolver_decision)
    if (!categoryStats[category]) {
      categoryStats[category] = {
        blocked_count: 0,
        domains: new Set(),
        avg_risk: 0,
        total_risk: 0,
        countries: new Set(),
        decisions: []
      }
    }
    categoryStats[category].blocked_count += item.blocked_count
    categoryStats[category].domains.add(item.domain)
    categoryStats[category].total_risk += item.risk_score
    categoryStats[category].countries.add(item.country)
    categoryStats[category].decisions.push(item.resolver_decision)
  })

  // Convert to array and calculate averages
  const categories = Object.entries(categoryStats)
    .map(([name, stats]) => ({
      name,
      blocked_count: stats.blocked_count,
      domain_count: stats.domains.size,
      avg_risk: stats.total_risk / stats.domains.size,
      country_count: stats.countries.size,
      primary_decision: stats.decisions.sort((a, b) => 
        stats.decisions.filter(d => d === b).length - stats.decisions.filter(d => d === a).length
      )[0]
    }))
    .sort((a, b) => b.blocked_count - a.blocked_count)

  // Get category icon and color
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Malware': return { icon: '🦠', color: 'text-red-400', bgColor: 'bg-red-900/30' }
      case 'Phishing': return { icon: '🎣', color: 'text-orange-400', bgColor: 'bg-orange-900/30' }
      case 'Botnet': return { icon: '🤖', color: 'text-purple-400', bgColor: 'bg-purple-900/30' }
      case 'Spam': return { icon: '📧', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' }
      case 'Security Policy': return { icon: '🛡️', color: 'text-blue-400', bgColor: 'bg-blue-900/30' }
      case 'Content Category': return { icon: '📋', color: 'text-indigo-400', bgColor: 'bg-indigo-900/30' }
      case 'Known Threat': return { icon: '⚠️', color: 'text-red-400', bgColor: 'bg-red-900/30' }
      case 'Advertising/Tracking': return { icon: '📊', color: 'text-cyan-400', bgColor: 'bg-cyan-900/30' }
      case 'Adult Content': return { icon: '🔞', color: 'text-pink-400', bgColor: 'bg-pink-900/30' }
      case 'Gambling': return { icon: '🎰', color: 'text-green-400', bgColor: 'bg-green-900/30' }
      case 'Social Media': return { icon: '📱', color: 'text-blue-400', bgColor: 'bg-blue-900/30' }
      case 'Gaming': return { icon: '🎮', color: 'text-purple-400', bgColor: 'bg-purple-900/30' }
      case 'Cryptocurrency': return { icon: '₿', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' }
      case 'High Risk': return { icon: '🚨', color: 'text-red-400', bgColor: 'bg-red-900/30' }
      case 'Suspicious Activity': return { icon: '🔍', color: 'text-orange-400', bgColor: 'bg-orange-900/30' }
      case 'Policy Violation': return { icon: '📜', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' }
      default: return { icon: '🔒', color: 'text-gray-400', bgColor: 'bg-gray-900/30' }
    }
  }

  const totalBlocked = categories.reduce((sum, cat) => sum + cat.blocked_count, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Top Blocked Categories</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Target className="h-4 w-4 mr-1" />
            <span>Threat categories</span>
          </div>
          <div className="text-sm text-danger-400 font-medium">
            {categories.length} categories
          </div>
        </div>
      </div>
      
      {categories.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {categories.slice(0, 8).map((category, index) => {
            const style = getCategoryStyle(category.name)
            const percentage = totalBlocked > 0 ? (category.blocked_count / totalBlocked) * 100 : 0
            
            return (
              <div 
                key={category.name}
                className={`flex items-center justify-between p-3 rounded-lg border border-gray-600 ${style.bgColor} hover:bg-opacity-50 transition-colors`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-sm font-medium text-gray-400 w-6">
                    #{index + 1}
                  </div>
                  <div className="text-lg flex-shrink-0">
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${style.color}`}>
                      {category.name}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                      <span>{category.domain_count} domains</span>
                      <span>•</span>
                      <span>{percentage.toFixed(1)}% of blocks</span>
                      <span>•</span>
                      <span>Risk: {category.avg_risk.toFixed(0)}</span>
                      {category.country_count > 1 && (
                        <>
                          <span>•</span>
                          <span>{category.country_count} countries</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-danger-400">
                    {category.blocked_count.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    blocks
                  </div>
                  <div className={`text-xs mt-1 ${style.color}`}>
                    Avg Risk: {category.avg_risk.toFixed(0)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <div className="text-lg mb-2">No blocked categories</div>
            <div className="text-sm">Threat categories will appear here</div>
          </div>
        </div>
      )}
    </div>
  )
}

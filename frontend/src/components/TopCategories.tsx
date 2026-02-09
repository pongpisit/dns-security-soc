import React from 'react'
import { Tag, TrendingUp, Shield } from 'lucide-react'
import { TopDomain, TopApplication } from '../services/api'

interface TopCategoriesProps {
  domains: TopDomain[]
  applications: TopApplication[]
  isLoading?: boolean
}

export function TopCategories({ domains, applications, isLoading }: TopCategoriesProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top Categories</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Tag className="h-4 w-4 mr-1" />
            <span>By usage</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  // Categorize domains and applications
  const categorizeService = (name: string): string => {
    const lowerName = name.toLowerCase()
    
    // Productivity & Office
    if (lowerName.includes('office') || lowerName.includes('microsoft') || 
        lowerName.includes('teams') || lowerName.includes('outlook') ||
        lowerName.includes('sharepoint') || lowerName.includes('onedrive')) {
      return 'Productivity & Office'
    }
    
    // Communication
    if (lowerName.includes('slack') || lowerName.includes('zoom') || 
        lowerName.includes('discord') || lowerName.includes('telegram') ||
        lowerName.includes('whatsapp') || lowerName.includes('skype')) {
      return 'Communication'
    }
    
    // Cloud Storage
    if (lowerName.includes('dropbox') || lowerName.includes('drive') || 
        lowerName.includes('icloud') || lowerName.includes('box') ||
        lowerName.includes('storage') || lowerName.includes('sync')) {
      return 'Cloud Storage'
    }
    
    // Development
    if (lowerName.includes('github') || lowerName.includes('gitlab') || 
        lowerName.includes('stackoverflow') || lowerName.includes('npm') ||
        lowerName.includes('docker') || lowerName.includes('api')) {
      return 'Development'
    }
    
    // Cloud Infrastructure
    if (lowerName.includes('aws') || lowerName.includes('azure') || 
        lowerName.includes('cloudflare') || lowerName.includes('gcp') ||
        lowerName.includes('cloud') || lowerName.includes('cdn')) {
      return 'Cloud Infrastructure'
    }
    
    // Social Media
    if (lowerName.includes('facebook') || lowerName.includes('twitter') || 
        lowerName.includes('linkedin') || lowerName.includes('instagram') ||
        lowerName.includes('social')) {
      return 'Social Media'
    }
    
    // Security
    if (lowerName.includes('security') || lowerName.includes('auth') || 
        lowerName.includes('ssl') || lowerName.includes('cert') ||
        lowerName.includes('firewall')) {
      return 'Security'
    }
    
    // Media & Entertainment
    if (lowerName.includes('youtube') || lowerName.includes('netflix') || 
        lowerName.includes('spotify') || lowerName.includes('media') ||
        lowerName.includes('video') || lowerName.includes('music')) {
      return 'Media & Entertainment'
    }
    
    // E-commerce
    if (lowerName.includes('amazon') || lowerName.includes('shop') || 
        lowerName.includes('store') || lowerName.includes('payment') ||
        lowerName.includes('commerce')) {
      return 'E-commerce'
    }
    
    return 'Other'
  }

  // Process categories
  const categoryStats: Record<string, { queries: number; blocked: number; services: Set<string> }> = {}

  // Add domain data
  domains.forEach(domain => {
    const category = categorizeService(domain.domain)
    if (!categoryStats[category]) {
      categoryStats[category] = { queries: 0, blocked: 0, services: new Set() }
    }
    categoryStats[category].queries += domain.queries
    categoryStats[category].blocked += domain.blocked
    categoryStats[category].services.add(domain.domain)
  })

  // Add application data
  applications.forEach(app => {
    const cleanApp = app.application.startsWith('[') ? 
      JSON.parse(app.application)[0] || 'Unknown' : app.application
    const category = categorizeService(cleanApp)
    if (!categoryStats[category]) {
      categoryStats[category] = { queries: 0, blocked: 0, services: new Set() }
    }
    categoryStats[category].queries += app.queries
    categoryStats[category].blocked += app.blocked
    categoryStats[category].services.add(cleanApp)
  })

  // Convert to array and sort
  const categories = Object.entries(categoryStats)
    .map(([name, stats]) => ({
      name,
      queries: stats.queries,
      blocked: stats.blocked,
      serviceCount: stats.services.size,
      blockRate: stats.queries > 0 ? (stats.blocked / stats.queries) * 100 : 0
    }))
    .sort((a, b) => b.queries - a.queries)

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Productivity & Office': return '🏢'
      case 'Communication': return '💬'
      case 'Cloud Storage': return '☁️'
      case 'Development': return '👨‍💻'
      case 'Cloud Infrastructure': return '🌐'
      case 'Social Media': return '📱'
      case 'Security': return '🔒'
      case 'Media & Entertainment': return '🎬'
      case 'E-commerce': return '🛒'
      default: return '📊'
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Productivity & Office': return 'text-blue-400'
      case 'Communication': return 'text-green-400'
      case 'Cloud Storage': return 'text-purple-400'
      case 'Development': return 'text-orange-400'
      case 'Cloud Infrastructure': return 'text-cyan-400'
      case 'Social Media': return 'text-pink-400'
      case 'Security': return 'text-red-400'
      case 'Media & Entertainment': return 'text-yellow-400'
      case 'E-commerce': return 'text-indigo-400'
      default: return 'text-gray-400'
    }
  }

  const totalQueries = categories.reduce((sum, cat) => sum + cat.queries, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Top Categories</h3>
        <div className="flex items-center text-sm text-gray-400">
          <Tag className="h-4 w-4 mr-1" />
          <span>By usage</span>
        </div>
      </div>
      
      {categories.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {categories.slice(0, 8).map((category, index) => {
            const percentage = totalQueries > 0 ? (category.queries / totalQueries) * 100 : 0
            
            return (
              <div 
                key={category.name}
                className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-sm font-medium text-gray-400 w-6">
                    #{index + 1}
                  </div>
                  <div className="text-lg flex-shrink-0">
                    {getCategoryIcon(category.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${getCategoryColor(category.name)}`}>
                      {category.name}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{category.serviceCount} services</span>
                      <span>•</span>
                      <span>{percentage.toFixed(1)}% of queries</span>
                      {category.blocked > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-danger-400">{category.blocked} blocked</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-primary-400">
                    {category.queries.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    queries
                  </div>
                  {category.blockRate > 0 && (
                    <div className="text-xs text-danger-400 mt-1">
                      {category.blockRate.toFixed(1)}% blocked
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <div className="text-lg mb-2">No category data</div>
            <div className="text-sm">Service categories will appear here</div>
          </div>
        </div>
      )}
    </div>
  )
}

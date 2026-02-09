import React from 'react'
import { Tag, Shield, Activity, TrendingUp } from 'lucide-react'
import { CategoryData } from '../services/api'

interface CloudflareCategoriesProps {
  data: CategoryData[]
  isLoading?: boolean
}

export function CloudflareCategories({ data, isLoading }: CloudflareCategoriesProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cloudflare Categories</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Tag className="h-4 w-4 mr-1" />
            <span>Real-time from GraphQL</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cloudflare Categories</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Tag className="h-4 w-4 mr-1" />
            <span>Real-time from GraphQL</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <div className="text-lg mb-2">No category data</div>
            <div className="text-sm">Cloudflare categories will appear here</div>
            <div className="text-xs mt-1">Categories are fetched from GraphQL API</div>
          </div>
        </div>
      </div>
    )
  }

  // Get category icon based on category name
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    
    // Security categories
    if (lowerCategory.includes('malware') || lowerCategory.includes('virus')) return '🦠'
    if (lowerCategory.includes('phishing') || lowerCategory.includes('fraud')) return '🎣'
    if (lowerCategory.includes('botnet') || lowerCategory.includes('bot')) return '🤖'
    if (lowerCategory.includes('spam')) return '📧'
    if (lowerCategory.includes('adult') || lowerCategory.includes('porn')) return '🔞'
    if (lowerCategory.includes('gambling') || lowerCategory.includes('casino')) return '🎰'
    
    // Business categories
    if (lowerCategory.includes('business') || lowerCategory.includes('corporate')) return '🏢'
    if (lowerCategory.includes('finance') || lowerCategory.includes('banking')) return '💰'
    if (lowerCategory.includes('education') || lowerCategory.includes('academic')) return '🎓'
    if (lowerCategory.includes('government') || lowerCategory.includes('public')) return '🏛️'
    if (lowerCategory.includes('healthcare') || lowerCategory.includes('medical')) return '🏥'
    
    // Technology categories
    if (lowerCategory.includes('cloud') || lowerCategory.includes('saas')) return '☁️'
    if (lowerCategory.includes('social') || lowerCategory.includes('media')) return '📱'
    if (lowerCategory.includes('news') || lowerCategory.includes('media')) return '📰'
    if (lowerCategory.includes('shopping') || lowerCategory.includes('ecommerce')) return '🛒'
    if (lowerCategory.includes('entertainment') || lowerCategory.includes('streaming')) return '🎬'
    if (lowerCategory.includes('gaming') || lowerCategory.includes('games')) return '🎮'
    
    // Content categories
    if (lowerCategory.includes('search') || lowerCategory.includes('portal')) return '🔍'
    if (lowerCategory.includes('reference') || lowerCategory.includes('wiki')) return '📚'
    if (lowerCategory.includes('travel') || lowerCategory.includes('tourism')) return '✈️'
    if (lowerCategory.includes('sports') || lowerCategory.includes('fitness')) return '⚽'
    if (lowerCategory.includes('food') || lowerCategory.includes('restaurant')) return '🍽️'
    
    // Technical categories
    if (lowerCategory.includes('cdn') || lowerCategory.includes('infrastructure')) return '🌐'
    if (lowerCategory.includes('api') || lowerCategory.includes('service')) return '🔧'
    if (lowerCategory.includes('analytics') || lowerCategory.includes('tracking')) return '📊'
    if (lowerCategory.includes('advertising') || lowerCategory.includes('ads')) return '📢'
    
    return '📂' // Default folder icon
  }

  // Get category color based on type
  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase()
    
    // Security (red variants)
    if (lowerCategory.includes('malware') || lowerCategory.includes('phishing') || 
        lowerCategory.includes('botnet') || lowerCategory.includes('spam')) {
      return 'text-red-400'
    }
    
    // Adult/Restricted content (pink)
    if (lowerCategory.includes('adult') || lowerCategory.includes('gambling')) {
      return 'text-pink-400'
    }
    
    // Business (blue variants)
    if (lowerCategory.includes('business') || lowerCategory.includes('finance') || 
        lowerCategory.includes('corporate') || lowerCategory.includes('government')) {
      return 'text-blue-400'
    }
    
    // Technology (cyan/green variants)
    if (lowerCategory.includes('cloud') || lowerCategory.includes('saas') || 
        lowerCategory.includes('api') || lowerCategory.includes('cdn')) {
      return 'text-cyan-400'
    }
    
    // Social/Media (purple variants)
    if (lowerCategory.includes('social') || lowerCategory.includes('media') || 
        lowerCategory.includes('entertainment')) {
      return 'text-purple-400'
    }
    
    // Shopping/Commerce (green)
    if (lowerCategory.includes('shopping') || lowerCategory.includes('ecommerce')) {
      return 'text-green-400'
    }
    
    // Education/Reference (yellow)
    if (lowerCategory.includes('education') || lowerCategory.includes('reference') || 
        lowerCategory.includes('academic')) {
      return 'text-yellow-400'
    }
    
    return 'text-gray-400' // Default
  }

  // Clean up category names (remove common prefixes/suffixes)
  const cleanCategoryName = (category: string) => {
    return category
      .replace(/^(Category|Cat)[\s\-_]/i, '')
      .replace(/[\s\-_](Category|Cat)$/i, '')
      .trim()
  }

  const totalQueries = data.reduce((sum, cat) => sum + cat.queries, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Cloudflare Categories</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Tag className="h-4 w-4 mr-1" />
            <span>Real-time from GraphQL</span>
          </div>
          <div className="text-sm text-primary-400 font-medium">
            {data.length} categories
          </div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {data.slice(0, 10).map((category, index) => {
          const percentage = totalQueries > 0 ? (category.queries / totalQueries) * 100 : 0
          const cleanName = cleanCategoryName(category.category)
          const icon = getCategoryIcon(category.category)
          const color = getCategoryColor(category.category)
          
          return (
            <div 
              key={`${category.category}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 text-sm font-medium text-gray-400 w-6">
                  #{index + 1}
                </div>
                <div className="text-lg flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${color}`}>
                    {cleanName}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span>{percentage.toFixed(1)}% of queries</span>
                    {category.blocked > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-danger-400">{category.blocked} blocked</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-gray-500">
                      Decision: {category.resolver_decision}
                    </span>
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
                {category.blocked > 0 && (
                  <div className="text-xs text-danger-400 mt-1">
                    {((category.blocked / category.queries) * 100).toFixed(1)}% blocked
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No category data available</div>
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>📡 Data source: Cloudflare GraphQL API</span>
          <span>🏷️ Categories: {data.length}</span>
        </div>
      </div>
    </div>
  )
}

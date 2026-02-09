import React from 'react'
import { Activity, TrendingUp, Zap } from 'lucide-react'
import { TopApplication } from '../services/api'

interface TopApplicationsProps {
  data: TopApplication[]
  isLoading?: boolean
}

export function TopApplications({ data, isLoading }: TopApplicationsProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top Applications</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Activity className="h-4 w-4 mr-1" />
            <span>By query volume</span>
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
          <h3 className="card-title">Top Applications</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Activity className="h-4 w-4 mr-1" />
            <span>By query volume</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <div className="text-lg mb-2">No application data</div>
            <div className="text-sm">Application usage will appear here</div>
          </div>
        </div>
      </div>
    )
  }

  // Clean up application names (remove JSON array formatting)
  const cleanApplicationName = (app: string) => {
    if (app.startsWith('[') && app.endsWith(']')) {
      try {
        const parsed = JSON.parse(app)
        return Array.isArray(parsed) ? parsed[0] || 'Unknown' : app
      } catch {
        return app
      }
    }
    return app
  }

  // Get application icon
  const getApplicationIcon = (app: string) => {
    const cleanApp = cleanApplicationName(app).toLowerCase()
    if (cleanApp.includes('microsoft') || cleanApp.includes('office')) return '🏢'
    if (cleanApp.includes('google') || cleanApp.includes('gmail')) return '🔍'
    if (cleanApp.includes('slack')) return '💬'
    if (cleanApp.includes('zoom')) return '📹'
    if (cleanApp.includes('teams')) return '👥'
    if (cleanApp.includes('dropbox')) return '📦'
    if (cleanApp.includes('github')) return '🐙'
    if (cleanApp.includes('aws') || cleanApp.includes('amazon')) return '☁️'
    if (cleanApp.includes('cloudflare')) return '🌐'
    return '📱'
  }

  // Calculate total queries for percentage
  const totalQueries = data.reduce((sum, app) => sum + app.queries, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Top Applications</h3>
        <div className="flex items-center text-sm text-gray-400">
          <Activity className="h-4 w-4 mr-1" />
          <span>By query volume</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {data.slice(0, 10).map((app, index) => {
          const percentage = totalQueries > 0 ? (app.queries / totalQueries) * 100 : 0
          const cleanName = cleanApplicationName(app.application)
          
          return (
            <div 
              key={`${app.application}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 text-sm font-medium text-gray-400 w-6">
                  #{index + 1}
                </div>
                <div className="text-lg flex-shrink-0">
                  {getApplicationIcon(app.application)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {cleanName}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{percentage.toFixed(1)}% of queries</span>
                    {app.blocked > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-danger-400">{app.blocked} blocked</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-medium text-primary-400">
                  {app.queries.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  queries
                </div>
                {app.block_rate > 0 && (
                  <div className="text-xs text-danger-400 mt-1">
                    {app.block_rate.toFixed(1)}% blocked
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
            <div className="text-sm">No application data available</div>
          </div>
        </div>
      )}
    </div>
  )
}

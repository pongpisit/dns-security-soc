import React from 'react'
import { Globe, MapPin, Activity } from 'lucide-react'
import { DNSQuery, CountryAnalytics } from '../services/api'

interface ThreatMapProps {
  data: CountryAnalytics[]
}

export function ThreatMap({ data }: ThreatMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <div className="text-lg mb-2">No geographic data</div>
          <div className="text-sm">Query locations will appear here</div>
        </div>
      </div>
    )
  }

  // Process country analytics data
  const locations = data
    .map((country) => ({
      location: country.country,
      count: country.queries,
      blocked: country.blocked,
      avgRisk: 0, // Risk score not available in country data
      blockRate: country.block_rate
    }))
    .sort((a, b) => b.count - a.count)

  const getLocationFlag = (location: string) => {
    const flags: Record<string, string> = {
      'SG': '🇸🇬',
      'US': '🇺🇸',
      'TH': '🇹🇭',
      'JP': '🇯🇵',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'Unknown': '🌍'
    }
    return flags[location] || '🌍'
  }

  const getRiskColor = (avgRisk: number) => {
    if (avgRisk >= 80) return 'text-danger-400'
    if (avgRisk >= 50) return 'text-warning-400'
    if (avgRisk >= 20) return 'text-yellow-400'
    return 'text-success-400'
  }

  const getLocationName = (code: string) => {
    const names: Record<string, string> = {
      'SG': 'Singapore',
      'US': 'United States',
      'TH': 'Thailand',
      'JP': 'Japan',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'CA': 'Canada',
      'AU': 'Australia',
      'Unknown': 'Unknown Location'
    }
    return names[code] || code
  }

  return (
    <div className="h-64 overflow-y-auto">
      <div className="space-y-3">
        {locations.map(({ location, count, blocked, avgRisk, blockRate }) => (
          <div 
            key={location}
            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600"
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {getLocationFlag(location)}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white">
                    {getLocationName(location)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({location})
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center text-xs text-gray-400">
                    <Activity className="h-3 w-3 mr-1" />
                    <span>{count} queries</span>
                  </div>
                  
                  {blocked > 0 && (
                    <div className="flex items-center text-xs text-danger-400">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{blocked} blocked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-sm font-medium ${getRiskColor(avgRisk)}`}>
                {avgRisk.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400">
                Risk Score
              </div>
              {blockRate > 0 && (
                <div className="text-xs text-danger-400 mt-1">
                  {blockRate.toFixed(1)}% blocked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {locations.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No location data available</div>
          </div>
        </div>
      )}
    </div>
  )
}

  import React from 'react'
import { Globe, MapPin, TrendingUp } from 'lucide-react'

interface DestinationCountriesProps {
  data: any[]
  isLoading?: boolean
}

export function DestinationCountries({ data, isLoading }: DestinationCountriesProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Destination Countries</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  // Aggregate by destination country (resolved IP countries)
  const countryCounts = data.reduce((acc, item) => {
    // Handle both single country and array of countries
    const countries = item.resolved_ip_countries || item.resolvedIpCountries || []
    const countryList = Array.isArray(countries) ? countries : [countries].filter(Boolean)
    
    countryList.forEach((country: string) => {
      if (country && country !== 'Unknown') {
        acc[country] = (acc[country] || 0) + (item.count || 1)
      }
    })
    return acc
  }, {} as Record<string, number>)

  const total = Object.values(countryCounts).reduce((sum: number, count: number) => sum + count, 0)

  const sortedCountries = Object.entries(countryCounts)
    .map(([country, count]: [string, number]) => {
      const numCount = Number(count)
      const numTotal = Number(total)
      return {
        country,
        count: numCount,
        percentage: numTotal > 0 ? (numCount / numTotal) * 100 : 0
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const getCountryFlag = (countryCode: string) => {
    // Convert country code to flag emoji
    if (countryCode.length !== 2) return '🌍'
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  const getCountryColor = (index: number) => {
    const colors = ['blue', 'green', 'purple', 'yellow', 'pink', 'indigo', 'cyan', 'orange', 'teal', 'red']
    return colors[index % colors.length]
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Destination Countries</h3>
        <div className="flex items-center text-sm text-gray-400">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Where IPs resolve to</span>
        </div>
      </div>

      {sortedCountries.length > 0 ? (
        <div className="space-y-3">
          {/* Summary */}
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-primary-400" />
                <span className="text-sm text-gray-300">Total Destinations</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {Object.keys(countryCounts).length}
                </div>
                <div className="text-xs text-gray-400">countries</div>
              </div>
            </div>
          </div>

          {/* Country List */}
          <div className="space-y-3">
            {sortedCountries.map(({ country, count, percentage }, index) => {
              const color = getCountryColor(index)
              return (
                <div key={country} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCountryFlag(country)}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{country}</div>
                        <div className="text-xs text-gray-400">
                          {count.toLocaleString()} queries
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">
                        #{index + 1}
                      </div>
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
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Queries</span>
              <span className="text-white font-medium">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <MapPin className="h-12 w-12 text-gray-600 mb-3" />
          <p className="text-gray-400">No destination country data available</p>
          <p className="text-xs text-gray-500 mt-2">
            Destination countries show where resolved IPs are located
          </p>
        </div>
      )}
    </div>
  )
}

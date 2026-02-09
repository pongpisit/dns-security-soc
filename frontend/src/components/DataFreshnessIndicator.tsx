import React from 'react'
import { RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react'

interface DataFreshnessIndicatorProps {
  lastUpdated?: string
  isLoading?: boolean
  isError?: boolean
  dataAge?: number // in minutes
  className?: string
}

export function DataFreshnessIndicator({ 
  lastUpdated, 
  isLoading, 
  isError, 
  dataAge,
  className = '' 
}: DataFreshnessIndicatorProps) {
  const getStatusColor = () => {
    if (isError) return 'text-red-400'
    if (isLoading) return 'text-blue-400'
    if (dataAge && dataAge > 5) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusIcon = () => {
    if (isError) return <WifiOff className="h-3 w-3" />
    if (isLoading) return <RefreshCw className="h-3 w-3 animate-spin" />
    return <Wifi className="h-3 w-3" />
  }

  const getStatusText = () => {
    if (isError) return 'Connection error'
    if (isLoading) return 'Updating...'
    if (dataAge && dataAge > 5) return `${dataAge}m ago`
    if (lastUpdated) {
      const date = new Date(lastUpdated)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    }
    return 'Live'
  }

  return (
    <div className={`flex items-center space-x-1 text-xs ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  )
}

// Enhanced version with more details
export function DetailedDataFreshnessIndicator({ 
  lastUpdated, 
  isLoading, 
  isError, 
  dataAge,
  totalRecords,
  dataSource,
  className = '' 
}: DataFreshnessIndicatorProps & { 
  totalRecords?: number
  dataSource?: string 
}) {
  const getStatusColor = () => {
    if (isError) return 'text-red-400'
    if (isLoading) return 'text-blue-400'
    if (dataAge && dataAge > 5) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusIcon = () => {
    if (isError) return <WifiOff className="h-4 w-4" />
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />
    return <Wifi className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isError) return 'Connection error'
    if (isLoading) return 'Updating data...'
    return 'Live data'
  }

  const getDataAgeText = () => {
    if (dataAge && dataAge > 0) {
      if (dataAge < 1) return 'Just now'
      if (dataAge < 60) return `${Math.floor(dataAge)}m ago`
      const hours = Math.floor(dataAge / 60)
      const minutes = Math.floor(dataAge % 60)
      return `${hours}h ${minutes}m ago`
    }
    return 'Real-time'
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-3 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        <div className="text-xs text-gray-400">
          <Clock className="h-3 w-3 inline mr-1" />
          {getDataAgeText()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
        {totalRecords && (
          <div>
            <span className="text-gray-500">Records:</span>
            <span className="ml-1 text-white">{totalRecords.toLocaleString()}</span>
          </div>
        )}
        {dataSource && (
          <div>
            <span className="text-gray-500">Source:</span>
            <span className="ml-1 text-white capitalize">{dataSource}</span>
          </div>
        )}
      </div>
      
      {lastUpdated && (
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })}
        </div>
      )}
    </div>
  )
}

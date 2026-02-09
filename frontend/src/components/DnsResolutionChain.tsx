import React from 'react'
import { Link, ArrowRight, Globe, Server, Clock, AlertTriangle } from 'lucide-react'

interface ResolutionStep {
  step: number
  record_type: string
  query: string
  response: string[]
  response_time: number
  authoritative_server: string
  is_cached: boolean
  ttl: number
}

interface ResolutionChainData {
  domain: string
  final_ips: string[]
  total_steps: number
  total_time: number
  chain: ResolutionStep[]
  security_status: 'safe' | 'suspicious' | 'blocked'
  timestamp: string
}

interface DnsResolutionChainProps {
  data: ResolutionChainData[]
  isLoading?: boolean
  className?: string
}

export function DnsResolutionChain({ data, isLoading, className = '' }: DnsResolutionChainProps) {
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">DNS Resolution Chains</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Link className="h-4 w-4 mr-1" />
            <span>Resolution paths</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">DNS Resolution Chains</h3>
          <div className="flex items-center text-sm text-gray-400">
            <Link className="h-4 w-4 mr-1" />
            <span>Resolution paths</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No resolution chain data available</p>
          </div>
        </div>
      </div>
    )
  }

  const getSecurityColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'suspicious':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'blocked':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'A':
        return 'bg-blue-500/20 text-blue-400'
      case 'AAAA':
        return 'bg-purple-500/20 text-purple-400'
      case 'CNAME':
        return 'bg-amber-500/20 text-amber-400'
      case 'MX':
        return 'bg-green-500/20 text-green-400'
      case 'TXT':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-600/20 text-gray-300'
    }
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">DNS Resolution Chains</h3>
        <div className="flex items-center text-sm text-gray-400">
          <Link className="h-4 w-4 mr-1" />
          <span>{data.length} recent resolutions</span>
        </div>
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto">
        {data.slice(0, 5).map((resolution, index) => (
          <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            {/* Resolution Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-primary-400" />
                <div>
                  <h4 className="text-sm font-medium text-white">{resolution.domain}</h4>
                  <p className="text-xs text-gray-400">
                    {resolution.total_steps} steps • {resolution.total_time}ms total
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded border ${getSecurityColor(resolution.security_status)}`}>
                  {resolution.security_status.toUpperCase()}
                </span>
                <div className="text-xs text-gray-400">
                  {new Date(resolution.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* Resolution Chain */}
            <div className="space-y-3">
              {resolution.chain.map((step, stepIndex) => (
                <div key={stepIndex} className="relative">
                  {/* Connection Line */}
                  {stepIndex < resolution.chain.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-600" />
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500/20 border border-primary-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-400">{step.step}</span>
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${getRecordTypeColor(step.record_type)}`}>
                          {step.record_type}
                        </span>
                        {step.is_cached && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                            CACHED
                          </span>
                        )}
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.response_time}ms
                        </div>
                      </div>

                      <div className="text-sm text-white mb-1">
                        <span className="text-gray-400">Query:</span> {step.query}
                      </div>

                      <div className="text-sm text-white mb-2">
                        <span className="text-gray-400">Response:</span>
                        <div className="mt-1 space-y-1">
                          {step.response.map((resp, respIndex) => (
                            <div key={respIndex} className="pl-4 text-primary-400 font-mono text-xs">
                              {resp}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Server className="h-3 w-3" />
                          <span>{step.authoritative_server}</span>
                        </div>
                        <div>TTL: {step.ttl}s</div>
                      </div>
                    </div>

                    {/* Arrow to next step */}
                    {stepIndex < resolution.chain.length - 1 && (
                      <div className="flex-shrink-0 text-gray-600">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Final Result */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Final Resolution</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">IP Addresses:</div>
                  <div className="space-y-1">
                    {resolution.final_ips.map((ip, ipIndex) => (
                      <div key={ipIndex} className="text-sm font-mono text-primary-400">
                        {ip}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total Resolution Time</div>
                  <div className="text-lg font-bold text-white">{resolution.total_time}ms</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Link className="h-4 w-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Resolution Summary</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-xs">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {(data.reduce((sum, r) => sum + r.total_time, 0) / data.length).toFixed(0)}ms
            </div>
            <div className="text-gray-400">Avg Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {(data.reduce((sum, r) => sum + r.total_steps, 0) / data.length).toFixed(1)}
            </div>
            <div className="text-gray-400">Avg Steps</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">
              {data.filter(r => r.security_status === 'suspicious').length}
            </div>
            <div className="text-gray-400">Suspicious</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">
              {data.filter(r => r.security_status === 'blocked').length}
            </div>
            <div className="text-gray-400">Blocked</div>
          </div>
        </div>
      </div>
    </div>
  )
}

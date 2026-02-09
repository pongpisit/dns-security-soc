import React, { useState } from 'react'
import { 
  Bug, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  Activity,
  Clock,
  Server,
  AlertCircle,
  CheckCircle,
  Copy,
  Code
} from 'lucide-react'

interface DebugPanelProps {
  data?: any
  isLoading?: boolean
  error?: any
}

export function DebugPanel({ data, isLoading, error }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  // Extract debug information from the data
  const debugInfo = {
    dataSource: data?.source?.source || 'unknown',
    isRealtime: data?.source?.is_realtime || false,
    timestamp: data?.source?.timestamp || new Date().toISOString(),
    range: data?.source?.range || 'unknown',
    dataAgeMinutes: data?.source?.data_age_minutes || 0,
    queriesCount: data?.queries?.length || 0,
    hasError: !!error,
    isLoading: !!isLoading,
  }

  // Generate SQL query example based on data source
  const generateSQLQuery = () => {
    const now = new Date()
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    return `-- Log Explorer SQL Query Example
SELECT 
  Datetime,
  QueryName,
  QueryType,
  ResolverDecision,
  ColoCode,
  Location,
  SrcIP,
  Categories,
  PolicyName,
  MatchedCategoryNames,
  COUNT(*) as count
FROM gateway_dns
WHERE Date >= '${startTime.toISOString().split('T')[0]}'
  AND Date <= '${now.toISOString().split('T')[0]}'
  AND Datetime >= '${startTime.toISOString()}'
  AND Datetime <= '${now.toISOString()}'
GROUP BY 
  Datetime,
  QueryName,
  QueryType,
  ResolverDecision,
  ColoCode,
  Location,
  SrcIP,
  Categories,
  PolicyName,
  MatchedCategoryNames
ORDER BY Datetime DESC
LIMIT 1000`
  }

  // Generate GraphQL query example
  const generateGraphQLQuery = () => {
    const now = new Date()
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    return `# GraphQL Query Example
query GetDnsSecurityTelemetry {
  viewer {
    accounts(filter: { accountTag: "$accountId" }) {
      gatewayResolverQueriesAdaptiveGroups(
        filter: {
          datetime_geq: "${startTime.toISOString()}"
          datetime_leq: "${now.toISOString()}"
        }
        limit: 1000
        orderBy: [datetime_DESC]
      ) {
        count
        dimensions {
          queryName
          datetime
          resolverDecision
          categoryNames
          policyName
          matchedApplicationName
          resolvedIps
          srcIpCountry
          locationName
        }
      }
    }
  }
}`
  }

  const getDataSourceBadge = () => {
    const source = debugInfo.dataSource
    if (source === 'logexplorer_realtime') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          <Database className="h-3 w-3 mr-1" />
          Log Explorer
        </span>
      )
    } else if (source === 'graphql_realtime') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Activity className="h-3 w-3 mr-1" />
          GraphQL
        </span>
      )
    } else if (source === 'database') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          <Server className="h-3 w-3 mr-1" />
          Database
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
        Unknown
      </span>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      {/* Collapsed Header */}
      <div 
        className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl cursor-pointer hover:border-gray-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-lg">
              <Bug className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Debug Info</h3>
              <p className="text-xs text-gray-400">
                {debugInfo.dataSource === 'logexplorer_realtime' ? 'Log Explorer' : 
                 debugInfo.dataSource === 'graphql_realtime' ? 'GraphQL' : 
                 debugInfo.dataSource === 'database' ? 'Database' : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {debugInfo.isRealtime && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                <span className="text-xs text-green-400">Live</span>
              </div>
            )}
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl max-h-[600px] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Status Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                  <span className="text-sm text-gray-300">Data Source</span>
                  {getDataSourceBadge()}
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                  <span className="text-sm text-gray-300">Status</span>
                  {isLoading ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                      <Activity className="h-3 w-3 mr-1 animate-spin" />
                      Loading
                    </span>
                  ) : error ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                  <span className="text-sm text-gray-300">Realtime</span>
                  <span className="text-sm text-white font-mono">
                    {debugInfo.isRealtime ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                  <span className="text-sm text-gray-300">Data Age</span>
                  <span className="text-sm text-white font-mono">
                    {debugInfo.dataAgeMinutes} min
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                  <span className="text-sm text-gray-300">Records</span>
                  <span className="text-sm text-white font-mono">
                    {debugInfo.queriesCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                  <span className="text-sm text-gray-300">Time Range</span>
                  <span className="text-sm text-white font-mono">
                    {debugInfo.range}
                  </span>
                </div>
              </div>
            </div>

            {/* Query Examples Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Query Examples</h4>
              
              {/* Log Explorer Query */}
              {debugInfo.dataSource === 'logexplorer_realtime' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Log Explorer SQL</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(generateSQLQuery(), 'sql')
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                    >
                      {copiedSection === 'sql' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-gray-950 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                    {generateSQLQuery()}
                  </pre>
                </div>
              )}

              {/* GraphQL Query */}
              {debugInfo.dataSource === 'graphql_realtime' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">GraphQL Query</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(generateGraphQLQuery(), 'graphql')
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                    >
                      {copiedSection === 'graphql' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-gray-950 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                    {generateGraphQLQuery()}
                  </pre>
                </div>
              )}
            </div>

            {/* API Endpoints Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">API Endpoints</h4>
              <div className="space-y-1">
                <div className="p-2 bg-gray-800/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Health Check</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard('/api/health', 'health')
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      {copiedSection === 'health' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <code className="text-xs text-green-400">/api/health</code>
                </div>
                
                <div className="p-2 bg-gray-800/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Dashboard Overview</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard('/api/dashboard/overview', 'overview')
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      {copiedSection === 'overview' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <code className="text-xs text-green-400">/api/dashboard/overview</code>
                </div>

                <div className="p-2 bg-gray-800/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Time Series</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(`/api/dashboard/time-series?range=${debugInfo.range}`, 'timeseries')
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      {copiedSection === 'timeseries' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <code className="text-xs text-green-400">/api/dashboard/time-series?range={debugInfo.range}</code>
                </div>
              </div>
            </div>

            {/* Raw Data Section */}
            {data && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">Raw Response</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(JSON.stringify(data, null, 2), 'raw')
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                  >
                    {copiedSection === 'raw' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-950 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Details */}
            {error && (
              <div>
                <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">Error Details</h4>
                <div className="p-3 bg-red-950/50 border border-red-900 rounded">
                  <pre className="text-xs text-red-300 whitespace-pre-wrap">
                    {error.message || JSON.stringify(error, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Last Updated</span>
                </div>
                <span className="font-mono">{new Date(debugInfo.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

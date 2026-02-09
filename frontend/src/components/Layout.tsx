import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Shield, 
  Menu, 
  X,
  Activity,
  Globe,
  Clock
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch unified dashboard data for Quick Stats
  const { data: unifiedData } = useQuery({
    queryKey: ['dashboard-unified', '24h'],
    queryFn: () => apiClient.getUnifiedDashboardData('24h'),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Shield },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-lg font-semibold text-white">DNS SOC</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {/* Navigation removed - single dashboard view */}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gray-800 border-r border-gray-700">
          <div className="flex h-16 items-center px-4">
            <Shield className="h-8 w-8 text-primary-500" />
            <span className="ml-2 text-lg font-semibold text-white">DNS Security SOC</span>
          </div>
          
          {/* System Status */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                System Status
              </span>
              <div className={`flex items-center ${
                healthData?.success ? 'text-success-400' : 'text-danger-400'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  healthData?.success ? 'bg-success-400 animate-pulse' : 'bg-danger-400'
                }`} />
                <span className="text-xs">
                  {healthData?.success ? 'Healthy' : 'Offline'}
                </span>
              </div>
            </div>
            {healthData?.success && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Database</span>
                  <span className="text-success-400">Connected</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Cache</span>
                  <span className="text-success-400">Active</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Environment</span>
                  <span className="text-primary-400">Production</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex-1 px-4 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Total Queries</span>
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      {unifiedData?.overview?.total_queries_24h?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Last 24h</div>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Blocked</span>
                      <Shield className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      {unifiedData?.overview?.blocked_queries_24h?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Threats blocked</div>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Locations</span>
                      <Globe className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      {unifiedData?.countries?.length || '0'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Countries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-700">
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-700 bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-white">
                DNS Security Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Real-time indicator */}
              <div className="flex items-center text-sm text-gray-400">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse mr-2" />
                <span>Live</span>
              </div>
              
              {/* Global stats */}
              <div className="hidden sm:flex items-center space-x-4 text-sm">
                <div className="flex items-center text-gray-400">
                  <Globe className="h-4 w-4 mr-1" />
                  <span>SG</span>
                </div>
                <div className="flex items-center text-success-400">
                  <Activity className="h-4 w-4 mr-1" />
                  <span>17 queries</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

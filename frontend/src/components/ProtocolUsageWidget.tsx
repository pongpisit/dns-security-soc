import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { DnsProtocolUsage } from './DnsProtocolUsage'

interface ProtocolUsageWidgetProps {
  timeRange: string
  className?: string
}

export function ProtocolUsageWidget({ timeRange, className }: ProtocolUsageWidgetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['protocol-usage', timeRange],
    queryFn: () => apiClient.getProtocolUsage(timeRange),
    refetchInterval: 30000,
    staleTime: 25000,
  })

  return (
    <DnsProtocolUsage 
      data={data || []}
      isLoading={isLoading}
      className={className}
    />
  )
}

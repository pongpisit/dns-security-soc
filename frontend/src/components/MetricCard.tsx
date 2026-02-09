import React from 'react'
import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: 'positive' | 'negative' | 'neutral'
  trendValue?: string
  className?: string
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend = 'neutral', 
  trendValue,
  className 
}: MetricCardProps) {
  return (
    <div className={clsx('metric-card relative overflow-hidden', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          {trendValue && (
            <p className={clsx('metric-change', {
              'positive': trend === 'positive',
              'negative': trend === 'negative',
              'text-gray-400': trend === 'neutral'
            })}>
              {trendValue}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-white/80" />
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
        <Icon className="h-16 w-16" />
      </div>
    </div>
  )
}

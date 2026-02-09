import React from 'react'
import { Clock, Calendar, ChevronDown } from 'lucide-react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const timeRanges = [
  { value: '1h', label: 'Last Hour', icon: '⏰' },
  { value: '24h', label: 'Last 24 Hours', icon: '📅' },
  { value: '7d', label: 'Last 7 Days', icon: '📊' },
  { value: '30d', label: 'Last 30 Days', icon: '📈' },
  { value: '90d', label: 'Last 90 Days', icon: '📋' },
]

export function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const selectedRange = timeRanges.find(range => range.value === value) || timeRanges[1]

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer hover:bg-gray-600 transition-colors"
        >
          {timeRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.icon} {range.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Custom styled dropdown for better UX */}
      <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 hidden group-hover:block">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center space-x-3 ${
              value === range.value ? 'bg-primary-600 text-white' : 'text-gray-300'
            }`}
          >
            <span className="text-lg">{range.icon}</span>
            <div>
              <div className="font-medium">{range.label}</div>
              <div className="text-xs text-gray-400">
                {range.value === '1h' && 'Real-time data, updated every minute'}
                {range.value === '24h' && 'Hourly aggregated data'}
                {range.value === '7d' && 'Daily aggregated data'}
                {range.value === '30d' && 'Daily aggregated data'}
                {range.value === '90d' && 'Daily aggregated data'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

interface DateTimePickerProps {
  startDate?: string
  endDate?: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  className?: string
}

export function DateTimePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  className = '' 
}: DateTimePickerProps) {
  const now = new Date()
  const maxDate = now.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM format
  const minDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">From:</span>
        <input
          type="datetime-local"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">To:</span>
        <input
          type="datetime-local"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate || minDate}
          max={maxDate}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}

interface QuickTimePickerProps {
  onSelect: (range: { start: string; end: string; label: string }) => void
  className?: string
}

export function QuickTimePicker({ onSelect, className = '' }: QuickTimePickerProps) {
  const now = new Date()
  
  const quickRanges = [
    {
      label: 'Last 15 minutes',
      start: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      end: now.toISOString(),
    },
    {
      label: 'Last hour',
      start: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      end: now.toISOString(),
    },
    {
      label: 'Last 6 hours',
      start: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      end: now.toISOString(),
    },
    {
      label: 'Today',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      end: now.toISOString(),
    },
    {
      label: 'Yesterday',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
    },
    {
      label: 'This week',
      start: new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000)).toISOString(),
      end: now.toISOString(),
    },
  ]

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {quickRanges.map((range) => (
        <button
          key={range.label}
          onClick={() => onSelect(range)}
          className="text-left px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors text-white"
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

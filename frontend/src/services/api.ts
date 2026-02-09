const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? '/api'
  : 'https://dns-security-soc.pongpisit.workers.dev/api'

export interface HealthResponse {
  success: boolean
  data?: {
    status: string
    database: string
    kv: string
    environment: string
    timestamp: string
  }
  error?: string
  timestamp: string
}

export interface DNSQuery {
  id: number
  timestamp: string
  query_name: string
  query_type: string
  resolver_decision: string
  source_ip: string
  user_email?: string
  device_name?: string
  location?: string
  count: number
  threat_category?: string
  risk_score: number
  blocked: boolean
  created_at: string
}

export interface TopApplication {
  application: string
  queries: number
  blocked: number
  block_rate: number
}

export interface TopDomain {
  domain: string
  queries: number
  blocked: number
  max_risk_score: number
  block_rate: number
}

export interface BlockedQuery {
  domain: string
  blocked_count: number
  risk_score: number
  threat_category?: string
  resolver_decision: string
  country: string
}

export interface CountryAnalytics {
  country: string
  queries: number
  blocked: number
  unique_domains: number
  block_rate: number
}

export interface DashboardOverview {
  total_queries_24h: number
  blocked_queries_24h: number
  threat_detection_rate: number
  unique_threats_24h: number
}

export interface CategoryData {
  category: string
  queries: number
  blocked: number
  resolver_decision: string
}

export interface SpeedTestResult {
  id: string
  timestamp: string
  download_speed: number // Mbps
  upload_speed: number // Mbps
  latency: number // ms
  jitter: number // ms
  packet_loss: number // percentage
  server_location: string
  client_ip: string
  user_agent: string
  test_duration: number // seconds
}

export interface NetworkPerformanceMetrics {
  current_speed: SpeedTestResult
  historical_average: {
    download_speed: number
    upload_speed: number
    latency: number
  }
  performance_trend: 'improving' | 'stable' | 'degrading'
  comparison_baseline?: {
    provider: string
    download_speed: number
    upload_speed: number
    latency: number
  }
}

export interface ProtocolUsageData {
  protocol: string
  queries: number
  percentage: number
  security_level: 'high' | 'medium' | 'standard'
}

export interface CachePerformanceData {
  status: string
  queries: number
  percentage: number
  avg_response_time: number
  trend: 'up' | 'down' | 'stable'
}

export interface CacheMetrics {
  hit_rate: number
  miss_rate: number
  total_queries: number
  avg_hit_time: number
  avg_miss_time: number
  performance_score: number
}

export interface UnifiedDashboardData {
  overview: DashboardOverview
  time_series: TimeSeriesData[]
  top_applications: TopApplication[]
  top_domains: TopDomain[]
  top_blocked: BlockedQuery[]
  top_allowed: AllowedDomain[]
  top_categories: CategoryData[]
  countries: CountryAnalytics[]
  network_performance?: NetworkPerformanceMetrics
}

export interface AllowedDomain {
  domain: string
  query_count: number
  unique_sources: number
  query_types: string
}

export interface DashboardMeta {
  range: string
  data_source: 'graphql_realtime' | 'database' | 'database_raw'
  is_realtime: boolean
  data_age_minutes?: number
  total_queries_processed: number
}

export interface TimeSeriesData {
  timestamp: string
  total_queries: number
  blocked_queries: number
  threat_score: number
}

export interface QueriesResponse {
  success: boolean
  data: DNSQuery[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
  timestamp: string
}

export interface TimeSeriesResponse {
  success: boolean
  data: TimeSeriesData[]
  meta: {
    total: number
    range: string
  }
  timestamp: string
}

export interface DashboardOverview {
  total_queries: number
  blocked_queries: number
  threat_score: number
  unique_domains: number
  top_countries: Array<{ country: string; count: number }>
  recent_threats: Array<{ domain: string; risk_score: number; timestamp: string }>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }

  async getDashboardOverview(): Promise<{ success: boolean; data?: DashboardOverview; error?: string }> {
    // Use unified data source for consistency
    const unified = await this.getUnifiedDashboardData('24h');
    return {
      success: true,
      data: unified.overview
    };
  }

  async getTimeSeriesData(range: string = '24h'): Promise<TimeSeriesResponse> {
    // Use unified data source for consistency
    const unified = await this.getUnifiedDashboardData(range);
    return {
      success: true,
      data: unified.time_series,
      timestamp: new Date().toISOString(),
      meta: {
        total: unified.time_series.length,
        range
      }
    };
  }

  async getQueries(params: {
    page?: number
    limit?: number
    domain?: string
    blocked?: boolean
    minRiskScore?: number
    startDate?: string
    endDate?: string
  } = {}): Promise<QueriesResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `/queries${queryString ? `?${queryString}` : ''}`
    
    return this.request<QueriesResponse>(endpoint)
  }

  async getRecentQueries(limit = 50, offset = 0): Promise<DNSQuery[]> {
    const response = await this.request<{data: DNSQuery[]}>(`/queries?limit=${limit}&offset=${offset}`);
    return response.data || [];
  }

  // Unified dashboard data - single source of truth
  async getUnifiedDashboardData(timeRange: string = '24h'): Promise<UnifiedDashboardData> {
    const response = await this.request<{ success: boolean; data: UnifiedDashboardData }>(`/dashboard/unified?range=${timeRange}`)
    if (!response.success) {
      throw new Error('Failed to fetch unified dashboard data')
    }
    return response.data
  }

  async getProtocolUsage(timeRange: string = '24h'): Promise<ProtocolUsageData[]> {
    const response = await this.request<{ success: boolean; data: ProtocolUsageData[] }>(`/dashboard/protocol-usage?range=${timeRange}`)
    if (!response.success) {
      throw new Error('Failed to fetch protocol usage data')
    }
    return response.data
  }

  async getCachePerformance(timeRange: string = '24h'): Promise<{ cache_data: CachePerformanceData[]; metrics: CacheMetrics }> {
    const response = await this.request<{ success: boolean; data: { cache_data: CachePerformanceData[]; metrics: CacheMetrics } }>(`/dashboard/cache-performance?range=${timeRange}`)
    if (!response.success) {
      throw new Error('Failed to fetch cache performance data')
    }
    return response.data
  }

  async getTopApplications(limit = 10, range = '24h'): Promise<TopApplication[]> {
    const unified = await this.getUnifiedDashboardData(range);
    return unified.top_applications.slice(0, limit);
  }

  async getTopDomains(limit = 10, range = '24h'): Promise<TopDomain[]> {
    const unified = await this.getUnifiedDashboardData(range);
    return unified.top_domains.slice(0, limit);
  }

  async getTopBlocked(limit = 10, range = '24h'): Promise<BlockedQuery[]> {
    const unified = await this.getUnifiedDashboardData(range);
    return unified.top_blocked.slice(0, limit);
  }

  async getCountryAnalytics(limit = 10, range = '24h'): Promise<CountryAnalytics[]> {
    const unified = await this.getUnifiedDashboardData(range);
    return unified.countries.slice(0, limit);
  }

  async getTopThreats(limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // Use unified data source for consistency
    const unified = await this.getUnifiedDashboardData('24h');
    return {
      success: true,
      data: unified.top_blocked.slice(0, limit)
    };
  }

  async getGeographicData(range: string = '24h'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // Use unified data source instead of separate endpoint
    const unified = await this.getUnifiedDashboardData(range);
    return {
      success: true,
      data: unified.countries
    };
  }

  async getDeviceAnalytics(range: string = '24h', limit: number = 20): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // Use unified data source for consistency (device data derived from unified queries)
    const unified = await this.getUnifiedDashboardData(range);
    // For now, return empty array since device analytics not implemented in unified data
    // This ensures consistency with single source approach
    return {
      success: true,
      data: []
    };
  }

  async getAllDashboardData(): Promise<{ success: boolean; data?: any; error?: string }> {
    // Use unified data source for complete dashboard consistency
    const unified = await this.getUnifiedDashboardData('24h');
    return {
      success: true,
      data: unified
    };
  }

  // Speed Test Methods
  async runSpeedTest(): Promise<{ success: boolean; data?: SpeedTestResult; error?: string }> {
    try {
      const response = await this.request<{ data: SpeedTestResult }>('/speed-test/run');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Speed test failed'
      };
    }
  }

  async getSpeedTestHistory(limit = 10): Promise<{ success: boolean; data?: SpeedTestResult[]; error?: string }> {
    try {
      const response = await this.request<{ data: SpeedTestResult[] }>(`/speed-test/history?limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch speed test history'
      };
    }
  }

  async getNetworkPerformanceMetrics(): Promise<{ success: boolean; data?: NetworkPerformanceMetrics; error?: string }> {
    try {
      const response = await this.request<{ data: NetworkPerformanceMetrics }>('/network/performance');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch network performance metrics'
      };
    }
  }

  // Zscaler Compatibility Methods
  async checkZscalerCompatibility(): Promise<{ success: boolean; data?: { compatible: boolean; conflicts: string[]; recommendations: string[] }; error?: string }> {
    try {
      const response = await this.request<{ 
        data: { 
          compatible: boolean; 
          conflicts: string[]; 
          recommendations: string[] 
        } 
      }>('/compatibility/zscaler');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check Zscaler compatibility'
      };
    }
  }

  async getAgentStatus(): Promise<{ success: boolean; data?: { cloudflare_active: boolean; zscaler_active: boolean; conflicts: boolean }; error?: string }> {
    try {
      const response = await this.request<{ 
        data: { 
          cloudflare_active: boolean; 
          zscaler_active: boolean; 
          conflicts: boolean 
        } 
      }>('/agent/status');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get agent status'
      };
    }
  }

  // Network Intelligence Methods
  async getResolutionChains(range: string = '24h'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await this.request<{ success: boolean; data: any[] }>(`/dashboard/resolution-chains?range=${range}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch resolution chains'
      };
    }
  }

  async getAuthoritativeNameservers(range: string = '24h'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await this.request<{ success: boolean; data: any[] }>(`/dashboard/authoritative-nameservers?range=${range}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch authoritative nameservers'
      };
    }
  }

  async getDnsErrors(range: string = '24h'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await this.request<{ success: boolean; data: any[] }>(`/dashboard/dns-errors?range=${range}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch DNS errors'
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

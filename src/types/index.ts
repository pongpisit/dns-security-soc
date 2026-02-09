// Environment bindings
export interface Env {
  ENVIRONMENT: 'production' | 'development';
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  DB: D1Database;
  CACHE_KV: KVNamespace;
  DNS_ANALYTICS: AnalyticsEngineDataset;
  DNS_PIPELINE?: Pipeline<any>; // Optional for development
  DNS_ARCHIVE?: R2Bucket; // Optional for development
}

// Pipeline interface for Cloudflare Pipelines
export interface Pipeline<T> {
  send(records: T[]): Promise<void>;
}

// Cloudflare GraphQL Response Types
export interface CloudflareGraphQLResponse {
  data: {
    viewer: {
      accounts: Array<{
        gatewayResolverQueriesAdaptiveGroups: Array<{
          count: number;
          dimensions: {
            // Basic query information
            queryName: string;
            queryNameReversed: string;
            datetime: string;
            datetimeHour: string;
            datetimeMinute: string;
            
            // Security-focused dimensions
            resolverDecision: string;
            categoryIds: string;
            categoryNames: string[];
            policyId: string;
            policyName: string;
            matchedApplicationId: string;
            matchedApplicationName: string;
            matchedIndicatorFeedIds: string;
            matchedIndicatorFeedNames: string[];
            
            // Network dimensions
            resolvedIps: string[];
            cnames: string[];
            authoritativeNameserverIps: string[];
            resourceRecordTypes: string[];
            resourceRecordClasses: string[];
            internalDnsRCode: string;
            customResolverResponseCode: string;
            customResolverCacheStatus: string;
            edeErrors: string[];
            
            // Geographic dimensions
            srcIpCountry: string;
            srcIpContinent: string;
            resolvedIpCountries: string[];
            resolvedIpContinents: string[];
            locationId: string;
            locationName: string;
            
            // User/device information
            deviceId?: string;
            deviceName?: string;
            userEmail?: string;
            
            // Additional context
            dohSubdomain?: string;
            dotSubdomain?: string;
            scheduleInfo?: string;
          };
        }>;
        gatewayHttpRequestsAdaptiveGroups?: Array<{
          count: number;
          dimensions: {
            host: string;
            httpStatusCode: number;
            userAgent: string;
            sourceIP: string;
            datetime: string;
          };
        }>;
      }>;
    };
  };
  errors?: Array<{
    message: string;
    path: string[];
  }>;
}

// DNS Security Metrics Types
export interface DNSQueryMetric {
  id?: number;
  timestamp: string;
  query_name: string;
  query_type: string;
  resolver_decision: string;
  source_ip: string;
  user_email?: string | null;
  device_name?: string | null;
  location?: string | null;
  count: number;
  threat_category?: string | null;
  risk_score?: number;
  blocked: boolean;
}

export interface DNSSecuritySummary {
  timestamp: string;
  total_queries: number;
  blocked_queries: number;
  allowed_queries: number;
  unique_domains: number;
  unique_sources: number;
  top_threats: Array<{
    domain: string;
    count: number;
    category: string;
  }>;
  geographic_distribution: Array<{
    location: string;
    count: number;
  }>;
}

export interface ThreatIntelligence {
  domain: string;
  category: string;
  risk_score: number;
  first_seen: string;
  last_seen: string;
  total_queries: number;
  blocked_count: number;
  source_ips: string[];
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Dashboard Data Types
export interface DashboardMetrics {
  overview: {
    total_queries_24h: number;
    blocked_queries_24h: number;
    threat_detection_rate: number;
    unique_threats_24h: number;
  };
  time_series: Array<{
    timestamp: string;
    total_queries: number;
    blocked_queries: number;
    threat_score: number;
  }>;
  top_threats: Array<{
    domain: string;
    category: string;
    count: number;
    risk_score: number;
  }>;
  geographic_data: Array<{
    country: string;
    queries: number;
    threats: number;
  }>;
  device_analytics: Array<{
    device_name: string;
    user_email: string;
    queries: number;
    threats: number;
  }>;
}

// Cron Job Types
export interface CronJobResult {
  job_type: 'realtime' | 'hourly' | 'daily';
  execution_time: string;
  records_processed: number;
  success: boolean;
  error?: string;
  duration_ms: number;
}

// GraphQL Query Variables
export interface GraphQLQueryVariables {
  accountId: string;
  datetimeStart: string;
  datetimeEnd: string;
  limit?: number;
  orderBy?: string;
}

// Database Schema Types
export interface DBSchema {
  dns_queries: DNSQueryMetric;
  dns_summaries: DNSSecuritySummary;
  threat_intelligence: ThreatIntelligence;
  cron_logs: CronJobResult;
}

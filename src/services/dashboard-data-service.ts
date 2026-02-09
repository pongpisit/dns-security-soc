import { Env } from '../types';
import { CloudflareGraphQLService } from './cloudflare-graphql';

export interface DashboardDataSource {
  source: 'graphql_realtime' | 'database' | 'database_raw';
  timestamp: string;
  range: string;
  is_realtime: boolean;
  data_age_minutes?: number;
}

export interface ProcessedDNSData {
  queries: Array<{
    timestamp: string;
    query_name: string;
    query_type: string;
    resolver_decision: string;
    source_ip: string;
    location?: string;
    count: number;
    threat_category?: string;
    risk_score: number;
    blocked: boolean;
    application_name?: string;
    cnames?: string[];
    resolved_ips?: string[];
    resolved_ip_countries?: string[];
    authoritative_nameserver_ips?: string[];
    cache_status?: string;
    ede_errors?: string[];
    internal_dns_rcode?: string;
    custom_resolver_response_code?: string;
  }>;
  source: DashboardDataSource;
}

/**
 * Centralized data service that ensures all dashboard components
 * use the same data source and maintain consistency
 */
export class DashboardDataService {
  private graphqlService: CloudflareGraphQLService;
  private cachedData: Map<string, { data: ProcessedDNSData; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache

  constructor(private env: Env) {
    this.graphqlService = new CloudflareGraphQLService(env);
  }

  /**
   * Get unified DNS data for dashboard - single source of truth
   */
  async getDashboardData(range: string = '24h'): Promise<ProcessedDNSData> {
    const cacheKey = `dashboard_${range}`;
    const cached = this.cachedData.get(cacheKey);
    
    // Return cached data if still fresh
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let timeFilter: string;
    switch (range) {
      case '1h':
        timeFilter = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        timeFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default: // 24h
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }

    const requestedDate = new Date(timeFilter);
    const isWithin30Days = requestedDate >= thirtyDaysAgo;
    
    let processedData: ProcessedDNSData;

    // Use GraphQL for recent data (within 30 days), Database for older data
    if (isWithin30Days && (range === '1h' || range === '24h' || range === '7d' || range === '30d')) {
      console.log(`Using GraphQL as primary source for ${range} dashboard data`);
      
      try {
        // Try GraphQL first for real-time data
        processedData = await this.getGraphQLData(timeFilter, now.toISOString(), range);
      } catch (error: any) {
        console.log('GraphQL failed, falling back to database:', error.message);
        processedData = await this.getDatabaseData(timeFilter, range);
      }
    } else {
      console.log(`Using database as single source for ${range} dashboard data`);
      processedData = await this.getDatabaseData(timeFilter, range);
    }

    // Cache the result
    this.cachedData.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    return processedData;
  }

  /**
   * Get data from GraphQL API (secondary fallback)
   */
  private async getGraphQLData(startTime: string, endTime: string, range: string): Promise<ProcessedDNSData> {
    const now = new Date();
    
    // Fetch data from GraphQL API
    const result = await this.graphqlService.getDnsSecurityTelemetry(
      startTime,
      endTime,
      10000 // Limit to 10,000 records
    );
    
    const graphqlData = result.data?.viewer?.accounts?.[0]?.gatewayResolverQueriesAdaptiveGroups || [];
    
    if (!graphqlData || graphqlData.length === 0) {
      throw new Error('No GraphQL data available');
    }
    
    // Transform GraphQL data to ProcessedDNSData format
    const queries = graphqlData.map((item: any) => {
      const dimensions = item.dimensions || {};
      
      // Map resolver decision to blocked status
      const blockedDecisions = ['2', '3', '6', '9'];
      const blocked = blockedDecisions.includes(String(dimensions.resolverDecision));
      
      // Extract threat category
      let threatCategory: string | undefined = undefined;
      if (dimensions.categoryNames && Array.isArray(dimensions.categoryNames)) {
        const securityCategories = dimensions.categoryNames.filter((cat: string) => 
          cat.toLowerCase().includes('malware') || 
          cat.toLowerCase().includes('phishing') ||
          cat.toLowerCase().includes('botnet') ||
          cat.toLowerCase().includes('spyware')
        );
        threatCategory = securityCategories.length > 0 ? securityCategories[0] : undefined;
      }
      
      // Calculate risk score
      let riskScore = 0;
      if (blocked) {
        riskScore = 80;
        if (threatCategory) {
          if (threatCategory.toLowerCase().includes('malware')) riskScore += 15;
          if (threatCategory.toLowerCase().includes('phishing')) riskScore += 10;
          if (threatCategory.toLowerCase().includes('botnet')) riskScore += 20;
          if (threatCategory.toLowerCase().includes('spyware')) riskScore += 15;
        }
        riskScore = Math.min(riskScore, 100);
      }
      
      return {
        timestamp: dimensions.datetime || now.toISOString(),
        query_name: dimensions.queryName || 'unknown',
        query_type: (dimensions.resourceRecordTypes && dimensions.resourceRecordTypes[0]) || 'A',
        resolver_decision: String(dimensions.resolverDecision || '0'),
        source_ip: dimensions.srcIpCountry || 'Unknown',
        location: dimensions.locationName || undefined,
        count: item.count || 1,
        threat_category: threatCategory,
        risk_score: riskScore,
        blocked: blocked,
        application_name: dimensions.matchedApplicationName || this.inferApplicationFromDomain(dimensions.queryName || ''),
        cnames: dimensions.cnames || [],
        resolved_ips: dimensions.resolvedIps || [],
        resolved_ip_countries: dimensions.resolvedIpCountries || [],
        authoritative_nameserver_ips: dimensions.authoritativeNameserverIps || [],
        cache_status: dimensions.customResolverCacheStatus || undefined,
        ede_errors: dimensions.edeErrors || [],
        internal_dns_rcode: dimensions.internalDnsRCode || undefined,
        custom_resolver_response_code: dimensions.customResolverResponseCode || undefined
      };
    });
    
    const latestTimestamp = queries.length > 0 ? queries[0]?.timestamp : now.toISOString();
    const dataAge = Math.floor((now.getTime() - new Date(latestTimestamp).getTime()) / (1000 * 60));
    
    return {
      queries,
      source: {
        source: 'graphql_realtime',
        timestamp: now.toISOString(),
        range,
        is_realtime: true,
        data_age_minutes: dataAge
      }
    };
  }

  /**
   * Get data from database (fallback or historical)
   */
  private async getDatabaseData(timeFilter: string, range: string): Promise<ProcessedDNSData> {
    const dbResult = await this.env.DB.prepare(`
      SELECT 
        timestamp,
        query_name,
        query_type,
        resolver_decision,
        source_ip,
        location,
        count,
        threat_category,
        risk_score,
        blocked
      FROM dns_queries
      WHERE timestamp >= ?
      ORDER BY timestamp DESC
    `).bind(timeFilter).all<any>();

    const queries = (dbResult.results || []).map((row: any) => ({
      timestamp: row.timestamp,
      query_name: row.query_name,
      query_type: row.query_type,
      resolver_decision: row.resolver_decision,
      source_ip: row.source_ip,
      location: row.location,
      count: row.count,
      threat_category: row.threat_category,
      risk_score: row.risk_score || 0,
      blocked: Boolean(row.blocked),
      application_name: this.inferApplicationFromDomain(row.query_name)
    }));

    const latestTimestamp = queries.length > 0 ? queries[0].timestamp : new Date().toISOString();
    const dataAge = Math.floor((Date.now() - new Date(latestTimestamp).getTime()) / (1000 * 60));

    return {
      queries,
      source: {
        source: 'database',
        timestamp: new Date().toISOString(),
        range,
        is_realtime: false,
        data_age_minutes: dataAge
      }
    };
  }

  /**
   * Extract threat category from Log Explorer category names
   */
  private extractThreatCategory(categoryNames?: string | string[]): string | null {
    if (!categoryNames) return null;
    
    // Handle both string and array formats
    const categories = Array.isArray(categoryNames) ? categoryNames : [categoryNames];
    if (categories.length === 0) return null;
    
    const securityCategories = categories.filter(cat => 
      cat.toLowerCase().includes('malware') || 
      cat.toLowerCase().includes('phishing') ||
      cat.toLowerCase().includes('botnet') ||
      cat.toLowerCase().includes('spyware')
    );
    
    return securityCategories.length > 0 ? securityCategories[0] : null;
  }

  /**
   * Calculate risk score based on Log Explorer data
   */
  private calculateRiskScore(item: any): number {
    let riskScore = 0;
    
    // Check if blocked
    if (this.isBlocked(item.resolverdecision)) {
      riskScore = 80;
      
      // Adjust based on threat category
      const categoryNames = item.matchedcategorynames || item.categories;
      if (categoryNames) {
        const categories = Array.isArray(categoryNames) 
          ? categoryNames.join(' ').toLowerCase() 
          : String(categoryNames).toLowerCase();
        if (categories.includes('malware')) riskScore += 15;
        if (categories.includes('phishing')) riskScore += 10;
        if (categories.includes('botnet')) riskScore += 20;
        if (categories.includes('spyware')) riskScore += 15;
      }
      
      riskScore = Math.min(riskScore, 100);
    }
    
    return riskScore;
  }

  /**
   * Check if query was blocked
   */
  private isBlocked(resolverDecision?: string | number): boolean {
    if (!resolverDecision) return false;
    const resolverStr = String(resolverDecision).toLowerCase();
    const blockedDecisions = ['2', '3', '6', '9', 'block', 'blocked'];
    return blockedDecisions.includes(resolverStr);
  }

  /**
   * Extract application name from Log Explorer data (reverse domain name)
   */
  private extractApplicationName(queryNameReversed?: string): string | undefined {
    if (!queryNameReversed) return undefined;
    
    // Reverse the domain name back to normal format
    // e.g., "com.microsoft.office" -> "office.microsoft.com"
    const parts = queryNameReversed.split('.');
    const domain = parts.reverse().join('.');
    
    return this.inferApplicationFromDomain(domain);
  }

  /**
   * Infer application from domain name (for database data)
   */
  private inferApplicationFromDomain(domain: string): string | undefined {
    const domainLower = domain.toLowerCase();
    
    if (domainLower.includes('microsoft') || domainLower.includes('office') || domainLower.includes('teams')) {
      return 'Microsoft Office365';
    }
    if (domainLower.includes('slack')) {
      return 'Slack';
    }
    if (domainLower.includes('google') || domainLower.includes('gmail')) {
      return 'Google';
    }
    if (domainLower.includes('cloudflare')) {
      return 'Cloudflare';
    }
    
    return undefined;
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cachedData.clear();
  }
}

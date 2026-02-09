import { Env, DNSQueryMetric, DNSSecuritySummary, ThreatIntelligence } from '../types';
import { CloudflareGraphQLService } from './cloudflare-graphql';
import { PipelineStreamer } from './pipeline-streamer';

/**
 * Service for processing DNS security data from Cloudflare GraphQL API
 * Handles data transformation, storage, and aggregation
 */
export class DnsDataProcessor {
  private graphqlService: CloudflareGraphQLService;
  
  constructor(private env: Env) {
    this.graphqlService = new CloudflareGraphQLService(env);
  }

  /**
   * Process and store real-time DNS security telemetry
   * Called by the 5-minute cron job
   */
  async processRealtimeTelemetry(): Promise<{ 
    processed: number;
    stored: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    // Calculate time range (last 5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Fetch data from GraphQL API
    const result = await this.graphqlService.getDnsSecurityTelemetry(
      fiveMinutesAgo.toISOString(),
      now.toISOString(),
      10000 // Limit to 10,000 records
    );
    
    const queries = result.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
    
    if (queries.length === 0) {
      // Log empty result
      await this.logCronJob('realtime', 0, true);
      return { processed: 0, stored: 0, duration: Date.now() - startTime };
    }
    
    // Transform data
    const dnsQueries: DNSQueryMetric[] = queries.map(query => {
      const dimensions = query.dimensions;
      
      // Map resolver decision to blocked status
      const blockedDecisions = ['2', '3', '6', '9']; // Blocked decision codes
      const blocked = blockedDecisions.includes(dimensions.resolverDecision);
      
      // Extract threat category if available
      let threatCategory: string | undefined = undefined;
      if (dimensions.categoryNames && dimensions.categoryNames.length > 0) {
        const securityCategories = dimensions.categoryNames.filter((cat: string) => 
          cat.toLowerCase().includes('malware') || 
          cat.toLowerCase().includes('phishing') ||
          cat.toLowerCase().includes('botnet') ||
          cat.toLowerCase().includes('spyware')
        );
        
        if (securityCategories.length > 0) {
          threatCategory = securityCategories[0];
        }
      }
      
      // Calculate risk score based on category and decision
      let riskScore = 0;
      if (blocked) {
        riskScore = 80; // Base score for blocked queries
        
        // Adjust based on threat category
        if (threatCategory) {
          if (threatCategory.toLowerCase().includes('malware')) riskScore += 15;
          if (threatCategory.toLowerCase().includes('phishing')) riskScore += 10;
          if (threatCategory.toLowerCase().includes('botnet')) riskScore += 20;
          if (threatCategory.toLowerCase().includes('spyware')) riskScore += 15;
        }
        
        // Cap at 100
        riskScore = Math.min(riskScore, 100);
      }
      
      return {
        timestamp: dimensions.datetime || new Date().toISOString(),
        query_name: dimensions.queryName || 'unknown',
        query_type: (dimensions.resourceRecordTypes && dimensions.resourceRecordTypes[0]) || 'A',
        resolver_decision: dimensions.resolverDecision || '0',
        source_ip: dimensions.srcIpCountry || 'Unknown',
        user_email: null, // dimensions.userEmail - not available in all accounts
        device_name: null, // dimensions.deviceName - not available in all accounts
        location: dimensions.locationName || null,
        count: query.count || 1,
        threat_category: threatCategory || null,
        risk_score: riskScore || 0,
        blocked: blocked || false
      };
    });
    
    // Store in database
    let storedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < dnsQueries.length; i += batchSize) {
      const batch = dnsQueries.slice(i, i + batchSize);
      
      // Use a transaction for better performance
      const stmts = [];
      
      for (const query of batch) {
        stmts.push(this.env.DB.prepare(`
          INSERT INTO dns_queries (
            timestamp, query_name, query_type, resolver_decision, 
            source_ip, user_email, device_name, location,
            count, threat_category, risk_score, blocked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          query.timestamp,
          query.query_name,
          query.query_type,
          query.resolver_decision,
          query.source_ip,
          query.user_email ?? null,
          query.device_name ?? null,
          query.location ?? null,
          query.count,
          query.threat_category ?? null,
          query.risk_score ?? 0,
          query.blocked ? 1 : 0
        ));
      }
      
      try {
        await this.env.DB.batch(stmts);
        storedCount += batch.length;
      } catch (error) {
        console.error('Error storing DNS queries batch:', error);
      }
    }
    
    // Update threat intelligence for high-risk domains
    await this.updateThreatIntelligence(dnsQueries);
    
    // Stream to Pipeline for long-term R2 storage (90+ days)
    const streamer = new PipelineStreamer(this.env);
    const streamResult = await streamer.streamToPipeline(dnsQueries);
    console.log(`Pipeline stream: ${streamResult.sent} sent, ${streamResult.skipped} skipped`);
    
    // Log cron job execution
    await this.logCronJob('realtime', dnsQueries.length, true);
    
    return { 
      processed: dnsQueries.length, 
      stored: storedCount, 
      duration: Date.now() - startTime 
    };
  }

  /**
   * Process and store hourly aggregated DNS security data
   * Called by the hourly cron job
   */
  async processHourlyAggregation(): Promise<{ 
    processed: number;
    stored: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    // Calculate time range (last hour)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    try {
      // Get category metrics
      const categoryResult = await this.graphqlService.getDnsCategoryMetrics(
        oneHourAgo.toISOString(),
        now.toISOString(),
        1000
      );
      
      // Get geo metrics
      const geoResult = await this.graphqlService.getDnsGeoMetrics(
        oneHourAgo.toISOString(),
        now.toISOString(),
        1000
      );
      
      // Get top domains
      const domainsResult = await this.graphqlService.getTopDomains(
        oneHourAgo.toISOString(),
        now.toISOString(),
        100
      );
      
      // Get blocked queries
      const blockedResult = await this.graphqlService.getBlockedQueries(
        oneHourAgo.toISOString(),
        now.toISOString(),
        1000
      );
      
      // Process and store summaries
      const categoryQueries = categoryResult.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
      const geoQueries = geoResult.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
      const topDomains = domainsResult.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
      const blockedQueries = blockedResult.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
      
      // Calculate summary metrics
      const totalQueries = categoryQueries.reduce((sum, item) => sum + item.count, 0);
      const blockedCount = blockedQueries.reduce((sum, item) => sum + item.count, 0);
      const allowedCount = totalQueries - blockedCount;
      const uniqueDomains = new Set(topDomains.map(item => item.dimensions.queryName)).size;
      const uniqueSources = new Set(geoQueries.map(item => item.dimensions.srcIpCountry)).size;
      
      // Create top threats list
      const topThreats = blockedQueries
        .filter(item => item.dimensions.categoryNames && item.dimensions.categoryNames.length > 0)
        .slice(0, 10)
        .map(item => ({
          domain: item.dimensions.queryName,
          count: item.count,
          category: item.dimensions.categoryNames[0]
        }));
      
      // Create geographic distribution
      const geoDistribution = geoQueries
        .slice(0, 20)
        .map(item => ({
          location: item.dimensions.srcIpCountry || 'Unknown',
          count: item.count
        }));
      
      // Create summary object
      const summary: DNSSecuritySummary = {
        timestamp: now.toISOString(),
        total_queries: totalQueries,
        blocked_queries: blockedCount,
        allowed_queries: allowedCount,
        unique_domains: uniqueDomains,
        unique_sources: uniqueSources,
        top_threats: topThreats,
        geographic_distribution: geoDistribution
      };
      
      // Store summary in database
      await this.env.DB.prepare(`
        INSERT INTO dns_summaries (
          timestamp, period_type, total_queries, blocked_queries,
          allowed_queries, unique_domains, unique_sources,
          top_threats, geographic_distribution
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        summary.timestamp,
        'hourly',
        summary.total_queries,
        summary.blocked_queries,
        summary.allowed_queries,
        summary.unique_domains,
        summary.unique_sources,
        JSON.stringify(summary.top_threats),
        JSON.stringify(summary.geographic_distribution)
      ).run();
      
      // Store geographic analytics
      const geoStmts = geoQueries.map(item => 
        this.env.DB.prepare(`
          INSERT INTO geographic_analytics (
            timestamp, country, region, city, queries, threats, blocked, period_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          now.toISOString(),
          item.dimensions.srcIpCountry || 'Unknown',
          null,
          null,
          item.count,
          0, // Will update with threat count in a separate query
          0, // Will update with blocked count in a separate query
          'hourly'
        )
      );
      
      await this.env.DB.batch(geoStmts);
      
      // Log cron job execution
      await this.logCronJob('hourly', totalQueries, true);
      
      return { 
        processed: totalQueries, 
        stored: 1 + geoQueries.length, // 1 summary + geo analytics
        duration: Date.now() - startTime 
      };
    } catch (error) {
      console.error('Error processing hourly aggregation:', error);
      
      // Log failed cron job
      await this.logCronJob('hourly', 0, false, error.message);
      
      return { processed: 0, stored: 0, duration: Date.now() - startTime };
    }
  }

  /**
   * Process and store daily aggregated DNS security data
   * Called by the daily cron job
   */
  async processDailyAggregation(): Promise<{ 
    processed: number;
    stored: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Calculate time range (last 24 hours)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Aggregate from hourly summaries instead of querying GraphQL again
      const hourlySummaries = await this.env.DB.prepare(`
        SELECT * FROM dns_summaries 
        WHERE period_type = 'hourly' 
        AND timestamp >= ? 
        AND timestamp <= ?
      `).bind(
        yesterday.toISOString(),
        now.toISOString()
      ).all();
      
      if (!hourlySummaries.results || hourlySummaries.results.length === 0) {
        await this.logCronJob('daily', 0, false, 'No hourly summaries found');
        return { processed: 0, stored: 0, duration: Date.now() - startTime };
      }
      
      // Calculate daily totals
      const summaries = hourlySummaries.results as any[];
      
      const totalQueries = summaries.reduce((sum, item) => sum + item.total_queries, 0);
      const blockedQueries = summaries.reduce((sum, item) => sum + item.blocked_queries, 0);
      const allowedQueries = summaries.reduce((sum, item) => sum + item.allowed_queries, 0);
      
      // Aggregate unique domains and sources (approximate)
      const uniqueDomains = Math.max(...summaries.map(item => item.unique_domains));
      const uniqueSources = Math.max(...summaries.map(item => item.unique_sources));
      
      // Aggregate top threats
      const allThreats = summaries.flatMap(item => {
        try {
          return JSON.parse(item.top_threats);
        } catch (e) {
          return [];
        }
      });
      
      // Count threats by domain
      const threatCounts = new Map<string, { count: number, category: string }>();
      for (const threat of allThreats) {
        const existing = threatCounts.get(threat.domain);
        if (existing) {
          existing.count += threat.count;
        } else {
          threatCounts.set(threat.domain, { count: threat.count, category: threat.category });
        }
      }
      
      // Convert to array and sort
      const topThreats = Array.from(threatCounts.entries())
        .map(([domain, data]) => ({
          domain,
          count: data.count,
          category: data.category
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Aggregate geographic distribution
      const allGeoData = summaries.flatMap(item => {
        try {
          return JSON.parse(item.geographic_distribution);
        } catch (e) {
          return [];
        }
      });
      
      // Count queries by location
      const geoCounts = new Map<string, number>();
      for (const geo of allGeoData) {
        const existing = geoCounts.get(geo.location);
        if (existing) {
          geoCounts.set(geo.location, existing + geo.count);
        } else {
          geoCounts.set(geo.location, geo.count);
        }
      }
      
      // Convert to array and sort
      const geoDistribution = Array.from(geoCounts.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      
      // Create daily summary
      const dailySummary: DNSSecuritySummary = {
        timestamp: now.toISOString(),
        total_queries: totalQueries,
        blocked_queries: blockedQueries,
        allowed_queries: allowedQueries,
        unique_domains: uniqueDomains,
        unique_sources: uniqueSources,
        top_threats: topThreats,
        geographic_distribution: geoDistribution
      };
      
      // Store daily summary
      await this.env.DB.prepare(`
        INSERT INTO dns_summaries (
          timestamp, period_type, total_queries, blocked_queries,
          allowed_queries, unique_domains, unique_sources,
          top_threats, geographic_distribution
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        dailySummary.timestamp,
        'daily',
        dailySummary.total_queries,
        dailySummary.blocked_queries,
        dailySummary.allowed_queries,
        dailySummary.unique_domains,
        dailySummary.unique_sources,
        JSON.stringify(dailySummary.top_threats),
        JSON.stringify(dailySummary.geographic_distribution)
      ).run();
      
      // Log cron job execution
      await this.logCronJob('daily', totalQueries, true);
      
      return { 
        processed: totalQueries, 
        stored: 1, // 1 daily summary
        duration: Date.now() - startTime 
      };
    } catch (error) {
      console.error('Error processing daily aggregation:', error);
      
      // Log failed cron job
      await this.logCronJob('daily', 0, false, error.message);
      
      return { processed: 0, stored: 0, duration: Date.now() - startTime };
    }
  }

  /**
   * Update threat intelligence data for high-risk domains
   */
  private async updateThreatIntelligence(dnsQueries: DNSQueryMetric[]): Promise<void> {
    // Filter for high-risk queries (risk score > 70)
    const highRiskQueries = dnsQueries.filter(query => query.risk_score && query.risk_score > 70);
    
    if (highRiskQueries.length === 0) {
      return;
    }
    
    // Group by domain
    const domainMap = new Map<string, DNSQueryMetric[]>();
    for (const query of highRiskQueries) {
      const existing = domainMap.get(query.query_name);
      if (existing) {
        existing.push(query);
      } else {
        domainMap.set(query.query_name, [query]);
      }
    }
    
    // Process each domain
    for (const [domain, queries] of domainMap.entries()) {
      // Get existing threat intelligence
      const existingThreat = await this.env.DB.prepare(`
        SELECT * FROM threat_intelligence WHERE domain = ?
      `).bind(domain).first();
      
      const now = new Date().toISOString();
      const totalQueries = queries.reduce((sum, q) => sum + q.count, 0);
      const blockedCount = queries.filter(q => q.blocked).reduce((sum, q) => sum + q.count, 0);
      
      // Get most common category
      const categoryCounts = new Map<string, number>();
      for (const query of queries) {
        if (query.threat_category) {
          const existing = categoryCounts.get(query.threat_category);
          if (existing) {
            categoryCounts.set(query.threat_category, existing + 1);
          } else {
            categoryCounts.set(query.threat_category, 1);
          }
        }
      }
      
      // Sort categories by count
      const sortedCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const category = sortedCategories.length > 0 ? 
        sortedCategories[0][0] : 
        'Suspicious';
      
      // Calculate average risk score
      const avgRiskScore = Math.round(
        queries.reduce((sum, q) => sum + (q.risk_score || 0), 0) / queries.length
      );
      
      // Get source IPs
      const sourceIps = Array.from(new Set(
        queries.map(q => q.source_ip).filter(Boolean)
      ));
      
      if (existingThreat) {
        // Update existing threat
        await this.env.DB.prepare(`
          UPDATE threat_intelligence
          SET category = ?,
              risk_score = ?,
              last_seen = ?,
              total_queries = total_queries + ?,
              blocked_count = blocked_count + ?,
              source_ips = ?,
              updated_at = ?
          WHERE domain = ?
        `).bind(
          category,
          avgRiskScore,
          now,
          totalQueries,
          blockedCount,
          JSON.stringify(sourceIps),
          now,
          domain
        ).run();
      } else {
        // Insert new threat
        await this.env.DB.prepare(`
          INSERT INTO threat_intelligence (
            domain, category, risk_score, first_seen, last_seen,
            total_queries, blocked_count, source_ips, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          domain,
          category,
          avgRiskScore,
          now,
          now,
          totalQueries,
          blockedCount,
          JSON.stringify(sourceIps),
          now
        ).run();
      }
    }
  }

  /**
   * Log cron job execution
   */
  private async logCronJob(
    jobType: 'realtime' | 'hourly' | 'daily',
    recordsProcessed: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO cron_logs (
          job_type, execution_time, records_processed, 
          success, error, duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        jobType,
        new Date().toISOString(),
        recordsProcessed,
        success ? 1 : 0,
        error || null,
        0 // Will be updated by the cron handler
      ).run();
    } catch (dbError) {
      console.error('Error logging cron job:', dbError);
    }
  }
}

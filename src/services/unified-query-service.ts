import { Env, DNSQueryMetric } from '../types';
import { R2QueryService } from './r2-query-service';

/**
 * Unified Query Service - Queries across hot (D1) and cold (R2) storage
 * Provides seamless access to 90+ days of DNS security data
 */
export class UnifiedQueryService {
  private r2Service: R2QueryService;

  constructor(private env: Env) {
    this.r2Service = new R2QueryService(env);
  }

  /**
   * Query DNS data across both D1 (hot, 7 days) and R2 (cold, 90+ days)
   * Automatically routes queries to appropriate storage tier
   */
  async queryDnsData(params: {
    startDate: string;
    endDate: string;
    domain?: string;
    blocked?: boolean;
    limit?: number;
  }): Promise<{
    data: DNSQueryMetric[];
    sources: {
      d1_records: number;
      r2_records: number;
    };
    query_time_ms: number;
  }> {
    const startTime = Date.now();
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results: DNSQueryMetric[] = [];
    let d1Count = 0;
    let r2Count = 0;

    // Query hot storage (D1) for recent data (last 7 days)
    if (end > sevenDaysAgo) {
      const hotStart = start > sevenDaysAgo ? start : sevenDaysAgo;
      const hotResults = await this.queryD1(hotStart, end, params);
      results.push(...hotResults);
      d1Count = hotResults.length;
      console.log(`D1 query returned ${d1Count} records`);
    }

    // Query cold storage (R2) for older data (7+ days ago)
    if (start < sevenDaysAgo) {
      const coldEnd = end < sevenDaysAgo ? end : sevenDaysAgo;
      const coldResults = await this.r2Service.queryArchivedData({
        ...params,
        startDate: start.toISOString(),
        endDate: coldEnd.toISOString(),
        limit: params.limit ? params.limit - results.length : undefined
      });
      results.push(...coldResults);
      r2Count = coldResults.length;
      console.log(`R2 query returned ${r2Count} records`);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply limit
    const limited = params.limit ? results.slice(0, params.limit) : results;

    return {
      data: limited,
      sources: {
        d1_records: d1Count,
        r2_records: r2Count
      },
      query_time_ms: Date.now() - startTime
    };
  }

  /**
   * Get data retention statistics across all storage tiers
   */
  async getRetentionStats(): Promise<{
    d1_hot_storage: {
      records: number;
      oldest_date: string | null;
      newest_date: string | null;
    };
    r2_cold_storage: {
      files: number;
      oldest_date: string | null;
      newest_date: string | null;
      size_bytes: number;
    };
    total_retention_days: number;
  }> {
    // Get D1 stats
    const d1Stats = await this.env.DB.prepare(`
      SELECT 
        COUNT(*) as count,
        MIN(timestamp) as oldest,
        MAX(timestamp) as newest
      FROM dns_queries
    `).first();

    // Get R2 stats
    const r2Stats = await this.r2Service.getArchiveStats();

    // Calculate total retention
    const oldestDate = r2Stats.oldest_date || d1Stats.oldest;
    const retentionDays = oldestDate
      ? Math.floor((Date.now() - new Date(oldestDate).getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      d1_hot_storage: {
        records: d1Stats.count,
        oldest_date: d1Stats.oldest,
        newest_date: d1Stats.newest
      },
      r2_cold_storage: {
        files: r2Stats.total_files,
        oldest_date: r2Stats.oldest_date,
        newest_date: r2Stats.newest_date,
        size_bytes: r2Stats.total_size_bytes
      },
      total_retention_days: retentionDays
    };
  }

  /**
   * Query D1 hot storage
   */
  private async queryD1(
    start: Date,
    end: Date,
    params: any
  ): Promise<DNSQueryMetric[]> {
    let query = `
      SELECT * FROM dns_queries
      WHERE timestamp >= ? AND timestamp <= ?
    `;
    const bindings: any[] = [start.toISOString(), end.toISOString()];

    if (params.domain) {
      query += ` AND query_name LIKE ?`;
      bindings.push(`%${params.domain}%`);
    }

    if (params.blocked !== undefined) {
      query += ` AND blocked = ?`;
      bindings.push(params.blocked ? 1 : 0);
    }

    query += ` ORDER BY timestamp DESC`;

    if (params.limit) {
      query += ` LIMIT ?`;
      bindings.push(params.limit);
    }

    const result = await this.env.DB.prepare(query).bind(...bindings).all();
    return result.results as DNSQueryMetric[];
  }

  /**
   * Get time series data across all storage tiers
   */
  async getTimeSeries(params: {
    startDate: string;
    endDate: string;
    interval: 'minute' | 'hour' | 'day';
  }): Promise<Array<{
    timestamp: string;
    total_queries: number;
    blocked_queries: number;
    unique_domains: number;
  }>> {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // For recent data (< 7 days), query D1 with minute/hour granularity
    if (start >= sevenDaysAgo) {
      return this.getD1TimeSeries(start, end, params.interval);
    }

    // For older data, use hourly summaries from D1
    if (end < sevenDaysAgo) {
      return this.getSummaryTimeSeries(start, end);
    }

    // For mixed range, combine both sources
    const recentData = await this.getD1TimeSeries(sevenDaysAgo, end, params.interval);
    const historicalData = await this.getSummaryTimeSeries(start, sevenDaysAgo);

    return [...historicalData, ...recentData].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private async getD1TimeSeries(
    start: Date,
    end: Date,
    interval: string
  ): Promise<any[]> {
    const dateFormat = interval === 'minute' ? 'start of minute' :
                       interval === 'hour' ? 'start of hour' : 'start of day';

    const result = await this.env.DB.prepare(`
      SELECT 
        datetime(timestamp, '${dateFormat}') as timestamp,
        SUM(count) as total_queries,
        SUM(CASE WHEN blocked = 1 THEN count ELSE 0 END) as blocked_queries,
        COUNT(DISTINCT query_name) as unique_domains
      FROM dns_queries
      WHERE timestamp >= ? AND timestamp <= ?
      GROUP BY datetime(timestamp, '${dateFormat}')
      ORDER BY timestamp ASC
    `).bind(start.toISOString(), end.toISOString()).all();

    return result.results;
  }

  private async getSummaryTimeSeries(
    start: Date,
    end: Date
  ): Promise<any[]> {
    const result = await this.env.DB.prepare(`
      SELECT 
        timestamp,
        total_queries,
        blocked_queries,
        unique_domains
      FROM dns_summaries
      WHERE timestamp >= ? AND timestamp <= ?
        AND period_type = 'hourly'
      ORDER BY timestamp ASC
    `).bind(start.toISOString(), end.toISOString()).all();

    return result.results;
  }
}

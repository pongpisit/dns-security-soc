import { Env, DNSQueryMetric } from '../types';

/**
 * Service for streaming DNS security data to Cloudflare Pipelines
 * Handles transformation and batching for long-term R2 storage
 */
export class PipelineStreamer {
  constructor(private env: Env) {}

  /**
   * Stream DNS query metrics to Pipeline for automatic R2 archival
   * Pipeline handles batching, compression, and delivery
   */
  async streamToPipeline(queries: DNSQueryMetric[]): Promise<{
    sent: number;
    skipped: number;
  }> {
    // Skip if pipeline not configured (development environment)
    if (!this.env.DNS_PIPELINE) {
      console.log('Pipeline not configured, skipping stream');
      return { sent: 0, skipped: queries.length };
    }

    if (queries.length === 0) {
      return { sent: 0, skipped: 0 };
    }

    try {
      // Transform to pipeline-friendly format with all 25+ dimensions
      const events = queries.map(q => this.transformToEvent(q));

      // Send to pipeline (auto-batched, compressed, delivered to R2)
      await this.env.DNS_PIPELINE.send(events);

      console.log(`Streamed ${events.length} DNS events to pipeline`);
      return { sent: events.length, skipped: 0 };
    } catch (error) {
      console.error('Failed to stream to pipeline:', error);
      // Don't throw - we still have D1 storage as backup
      return { sent: 0, skipped: queries.length };
    }
  }

  /**
   * Transform DNS query metric to pipeline event format
   * Preserves all dimensions for comprehensive long-term analysis
   */
  private transformToEvent(query: DNSQueryMetric): Record<string, any> {
    return {
      // Metadata
      timestamp: query.timestamp,
      event_type: 'dns_query',
      event_version: '1.0',
      
      // Query information
      query: {
        name: query.query_name,
        type: query.query_type,
        decision: query.resolver_decision,
        count: query.count
      },
      
      // Source information
      source: {
        ip_country: query.source_ip,
        location: query.location,
        user_email: query.user_email,
        device_name: query.device_name
      },
      
      // Security information
      security: {
        blocked: query.blocked,
        threat_category: query.threat_category,
        risk_score: query.risk_score
      },
      
      // Metadata for querying and analysis
      metadata: {
        ingested_at: new Date().toISOString(),
        source_system: 'dns-security-soc',
        data_version: '1.0'
      }
    };
  }

  /**
   * Batch stream multiple collections of queries
   * Useful for backfilling or bulk operations
   */
  async streamBatch(batches: DNSQueryMetric[][]): Promise<{
    total_sent: number;
    total_skipped: number;
    batches_processed: number;
  }> {
    let totalSent = 0;
    let totalSkipped = 0;

    for (const batch of batches) {
      const result = await this.streamToPipeline(batch);
      totalSent += result.sent;
      totalSkipped += result.skipped;
    }

    return {
      total_sent: totalSent,
      total_skipped: totalSkipped,
      batches_processed: batches.length
    };
  }
}

import { Env, DNSQueryMetric } from '../types';

/**
 * Service for querying DNS security data from R2 long-term storage
 * Handles decompression and parsing of pipeline-generated NDJSON files
 */
export class R2QueryService {
  constructor(private env: Env) {}

  /**
   * Query archived DNS data from R2 for a specific date range
   * Returns data from pipeline-generated partitioned files
   */
  async queryArchivedData(params: {
    startDate: string;
    endDate: string;
    domain?: string;
    blocked?: boolean;
    limit?: number;
  }): Promise<DNSQueryMetric[]> {
    // Skip if R2 not configured (development environment)
    if (!this.env.DNS_ARCHIVE) {
      console.log('R2 archive not configured');
      return [];
    }

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const results: DNSQueryMetric[] = [];

    try {
      // List objects in date range (pipeline creates: event_date=YYYY-MM-DD/hr=HH/*.ndjson.gz)
      const prefix = 'dns/security/event_date=';
      const listed = await this.env.DNS_ARCHIVE.list({ prefix, limit: 1000 });

      console.log(`Found ${listed.objects.length} objects in R2 archive`);

      // Filter objects by date range
      const relevantObjects = listed.objects.filter(obj => {
        const match = obj.key.match(/event_date=(\d{4}-\d{2}-\d{2})/);
        if (!match) return false;
        
        const objDate = new Date(match[1]);
        return objDate >= start && objDate <= end;
      });

      console.log(`${relevantObjects.length} objects match date range`);

      // Download and parse each file
      for (const obj of relevantObjects.slice(0, 100)) { // Limit to 100 files
        try {
          const file = await this.env.DNS_ARCHIVE.get(obj.key);
          if (!file) continue;

          // Decompress and parse NDJSON
          const decompressed = await this.decompressGzip(await file.arrayBuffer());
          const lines = decompressed.split('\n').filter(l => l.trim());

          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              const record = this.transformEventToMetric(event);

              // Apply filters
              if (params.domain && !record.query_name.includes(params.domain)) {
                continue;
              }
              if (params.blocked !== undefined && record.blocked !== params.blocked) {
                continue;
              }

              results.push(record);

              // Check limit
              if (params.limit && results.length >= params.limit) {
                return results;
              }
            } catch (parseError) {
              console.error('Failed to parse line:', parseError);
            }
          }
        } catch (fileError) {
          console.error(`Failed to process file ${obj.key}:`, fileError);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to query R2 archive:', error);
      return [];
    }
  }

  /**
   * Get summary statistics from archived data
   */
  async getArchiveStats(): Promise<{
    total_files: number;
    oldest_date: string | null;
    newest_date: string | null;
    total_size_bytes: number;
  }> {
    if (!this.env.DNS_ARCHIVE) {
      return {
        total_files: 0,
        oldest_date: null,
        newest_date: null,
        total_size_bytes: 0
      };
    }

    try {
      const prefix = 'dns/security/event_date=';
      const listed = await this.env.DNS_ARCHIVE.list({ prefix, limit: 1000 });

      const dates = listed.objects
        .map(obj => {
          const match = obj.key.match(/event_date=(\d{4}-\d{2}-\d{2})/);
          return match ? match[1] : null;
        })
        .filter(d => d !== null)
        .sort();

      const totalSize = listed.objects.reduce((sum, obj) => sum + obj.size, 0);

      return {
        total_files: listed.objects.length,
        oldest_date: dates[0] || null,
        newest_date: dates[dates.length - 1] || null,
        total_size_bytes: totalSize
      };
    } catch (error) {
      console.error('Failed to get archive stats:', error);
      return {
        total_files: 0,
        oldest_date: null,
        newest_date: null,
        total_size_bytes: 0
      };
    }
  }

  /**
   * Decompress gzip data
   */
  private async decompressGzip(data: ArrayBuffer): Promise<string> {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(data));
        controller.close();
      }
    });

    const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
    const chunks: Uint8Array[] = [];

    const reader = decompressed.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const decoder = new TextDecoder();
    return chunks.map(chunk => decoder.decode(chunk)).join('');
  }

  /**
   * Transform pipeline event back to DNSQueryMetric format
   */
  private transformEventToMetric(event: any): DNSQueryMetric {
    return {
      timestamp: event.timestamp,
      query_name: event.query?.name || 'unknown',
      query_type: event.query?.type || 'A',
      resolver_decision: event.query?.decision || '0',
      source_ip: event.source?.ip_country || 'Unknown',
      user_email: event.source?.user_email || null,
      device_name: event.source?.device_name || null,
      location: event.source?.location || null,
      count: event.query?.count || 1,
      threat_category: event.security?.threat_category || null,
      risk_score: event.security?.risk_score || 0,
      blocked: event.security?.blocked || false
    };
  }
}

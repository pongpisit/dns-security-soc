import { Hono } from 'hono';
import { Env } from '../types';
import { UnifiedQueryService } from '../services/unified-query-service';

/**
 * Unified API routes for 90+ day data queries
 * Combines D1 (hot) and R2 (cold) storage
 */
export const unifiedApiRouter = new Hono<{ Bindings: Env }>();

/**
 * Query DNS data across all storage tiers (90+ days)
 * GET /api/unified/queries?startDate=...&endDate=...&domain=...&blocked=...&limit=...
 */
unifiedApiRouter.get('/queries', async (c) => {
  try {
    const startDate = c.req.query('startDate') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endDate = c.req.query('endDate') || new Date().toISOString();
    const domain = c.req.query('domain');
    const blocked = c.req.query('blocked');
    const limit = parseInt(c.req.query('limit') || '1000');

    const queryService = new UnifiedQueryService(c.env);
    const result = await queryService.queryDnsData({
      startDate,
      endDate,
      domain,
      blocked: blocked === 'true' ? true : blocked === 'false' ? false : undefined,
      limit
    });

    return c.json({
      success: true,
      data: result.data,
      metadata: {
        total_records: result.data.length,
        sources: result.sources,
        query_time_ms: result.query_time_ms,
        date_range: {
          start: startDate,
          end: endDate
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unified query error:', error);
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Get time series data across all storage tiers
 * GET /api/unified/time-series?startDate=...&endDate=...&interval=hour
 */
unifiedApiRouter.get('/time-series', async (c) => {
  try {
    const startDate = c.req.query('startDate') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endDate = c.req.query('endDate') || new Date().toISOString();
    const interval = (c.req.query('interval') || 'hour') as 'minute' | 'hour' | 'day';

    const queryService = new UnifiedQueryService(c.env);
    const data = await queryService.getTimeSeries({
      startDate,
      endDate,
      interval
    });

    return c.json({
      success: true,
      data,
      metadata: {
        total_points: data.length,
        interval,
        date_range: {
          start: startDate,
          end: endDate
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Time series query error:', error);
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Get data retention statistics
 * GET /api/unified/retention-stats
 */
unifiedApiRouter.get('/retention-stats', async (c) => {
  try {
    const queryService = new UnifiedQueryService(c.env);
    const stats = await queryService.getRetentionStats();

    return c.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Retention stats error:', error);
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Health check for unified storage
 * GET /api/unified/health
 */
unifiedApiRouter.get('/health', async (c) => {
  try {
    const queryService = new UnifiedQueryService(c.env);
    const stats = await queryService.getRetentionStats();

    const health = {
      status: 'healthy',
      storage_tiers: {
        d1_hot: {
          available: true,
          records: stats.d1_hot_storage.records,
          retention_days: 7
        },
        r2_cold: {
          available: !!c.env.DNS_ARCHIVE,
          files: stats.r2_cold_storage.files,
          size_mb: Math.round(stats.r2_cold_storage.size_bytes / 1024 / 1024),
          retention_days: stats.total_retention_days
        },
        pipeline: {
          configured: !!c.env.DNS_PIPELINE,
          status: c.env.DNS_PIPELINE ? 'active' : 'not_configured'
        }
      },
      total_retention_days: stats.total_retention_days,
      data_coverage: {
        oldest_date: stats.r2_cold_storage.oldest_date || stats.d1_hot_storage.oldest_date,
        newest_date: stats.d1_hot_storage.newest_date
      }
    };

    return c.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({
      success: false,
      error: error.message,
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

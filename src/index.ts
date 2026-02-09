import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { apiRouter } from './routes/api-routes';
import { unifiedApiRouter } from './routes/unified-api-routes';
import { DnsDataProcessor } from './services/dns-data-processor';

/**
 * DNS Security SOC Dashboard API
 * Provides real-time DNS security telemetry and analytics
 */
const app = new Hono<{ Bindings: Env }>();

// Configure CORS to allow requests from Pages domain
app.use('*', cors({
  origin: [
    'https://dns-security-dashboard.pages.dev',
    'https://*.dns-security-dashboard.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Mount API routes
app.route('/api', apiRouter);
app.route('/api/unified', unifiedApiRouter);

// Root route - API documentation
app.get('/', (c) => {
  return c.json({
    name: 'DNS Security SOC Dashboard API',
    version: '1.0.0',
    description: 'Real-time DNS security telemetry and analytics API',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      dashboard: {
        overview: '/api/dashboard/overview',
        timeSeries: '/api/dashboard/time-series',
        topThreats: '/api/dashboard/top-threats',
        geographic: '/api/dashboard/geographic',
        devices: '/api/dashboard/devices',
        all: '/api/dashboard/all'
      },
      queries: '/api/queries',
      collect: '/api/collect'
    },
    timestamp: new Date().toISOString()
  });
});

// API documentation
app.get('/api-docs', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'DNS Security SOC Dashboard API',
      version: '1.0.0',
      description: 'API for DNS security telemetry and analytics'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check endpoint',
          responses: {
            '200': {
              description: 'System health status'
            }
          }
        }
      },
      '/api/dashboard/overview': {
        get: {
          summary: 'Dashboard overview metrics',
          responses: {
            '200': {
              description: 'Overview metrics for the dashboard'
            }
          }
        }
      },
      '/api/dashboard/time-series': {
        get: {
          summary: 'Time series data for dashboard charts',
          parameters: [
            {
              name: 'range',
              in: 'query',
              description: 'Time range (1h, 24h, 7d, 30d, 90d)',
              schema: {
                type: 'string',
                default: '24h'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Time series data for the specified range'
            }
          }
        }
      },
      '/api/dashboard/top-threats': {
        get: {
          summary: 'Top threats data for dashboard',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Number of threats to return',
              schema: {
                type: 'integer',
                default: 10
              }
            }
          ],
          responses: {
            '200': {
              description: 'Top threats data'
            }
          }
        }
      },
      '/api/dashboard/geographic': {
        get: {
          summary: 'Geographic data for dashboard map',
          parameters: [
            {
              name: 'range',
              in: 'query',
              description: 'Time range (1h, 24h, 7d, 30d, 90d)',
              schema: {
                type: 'string',
                default: '24h'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Geographic data for the specified range'
            }
          }
        }
      },
      '/api/dashboard/devices': {
        get: {
          summary: 'Device analytics data for dashboard',
          parameters: [
            {
              name: 'range',
              in: 'query',
              description: 'Time range (1h, 24h, 7d, 30d, 90d)',
              schema: {
                type: 'string',
                default: '24h'
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of devices to return',
              schema: {
                type: 'integer',
                default: 20
              }
            }
          ],
          responses: {
            '200': {
              description: 'Device analytics data for the specified range'
            }
          }
        }
      },
      '/api/dashboard/all': {
        get: {
          summary: 'Complete dashboard data (all metrics in one call)',
          responses: {
            '200': {
              description: 'All dashboard metrics'
            }
          }
        }
      },
      '/api/queries': {
        get: {
          summary: 'Raw DNS query data with filtering and pagination',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: {
                type: 'integer',
                default: 1
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Results per page',
              schema: {
                type: 'integer',
                default: 100
              }
            },
            {
              name: 'domain',
              in: 'query',
              description: 'Filter by domain (partial match)',
              schema: {
                type: 'string'
              }
            },
            {
              name: 'blocked',
              in: 'query',
              description: 'Filter by blocked status (true/false)',
              schema: {
                type: 'boolean'
              }
            },
            {
              name: 'minRiskScore',
              in: 'query',
              description: 'Minimum risk score',
              schema: {
                type: 'integer'
              }
            },
            {
              name: 'startDate',
              in: 'query',
              description: 'Start date (ISO format)',
              schema: {
                type: 'string',
                format: 'date-time'
              }
            },
            {
              name: 'endDate',
              in: 'query',
              description: 'End date (ISO format)',
              schema: {
                type: 'string',
                format: 'date-time'
              }
            }
          ],
          responses: {
            '200': {
              description: 'DNS query data with pagination'
            }
          }
        }
      },
      '/api/collect': {
        post: {
          summary: 'Manually trigger data collection (admin only)',
          parameters: [
            {
              name: 'type',
              in: 'query',
              description: 'Collection type (realtime, hourly, daily)',
              schema: {
                type: 'string',
                default: 'realtime'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Collection result'
            },
            '401': {
              description: 'Unauthorized'
            },
            '403': {
              description: 'Forbidden'
            }
          }
        }
      }
    }
  });
});

// Error handling
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({
    success: false,
    error: `Internal server error: ${err.message}`,
    timestamp: new Date().toISOString()
  }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  }, 404);
});

/**
 * Cron handler for scheduled data collection
 * Uses Log Explorer for data collection (feature flag: USE_LOG_EXPLORER)
 */
const handleCron = async (event: any, env: Env, ctx: any) => {
  const startTime = Date.now();
  
  // Use GraphQL data processor for all data collection
  const processor = new DnsDataProcessor(env);
  
  console.log('Using GraphQL data processor for data collection');
  
  try {
    // Determine which cron job is running based on cron expression
    const cronExpression = event.cron;
    
    let result;
    let jobType: 'realtime' | 'hourly' | 'daily';
    
    const now = new Date();
    
    if (cronExpression === '*/5 * * * *') {
      // Every 5 minutes - realtime data collection
      jobType = 'realtime';
      // Collect real-time data from GraphQL (last 5 minutes)
      result = await processor.processRealtimeTelemetry();
    } else if (cronExpression === '0 * * * *') {
      // Every hour - hourly aggregation
      jobType = 'hourly';
      // Process hourly aggregation from GraphQL data
      result = await processor.processHourlyAggregation();
    } else if (cronExpression === '0 0 * * *') {
      // Every day - daily aggregation
      jobType = 'daily';
      // Process daily aggregation from GraphQL data
      result = await processor.processDailyAggregation();
    } else {
      console.error(`Unknown cron expression: ${cronExpression}`);
      return;
    }
    
    // Update cron job duration
    const duration = Date.now() - startTime;
    
    await env.DB.prepare(`
      INSERT INTO cron_logs (
        job_type, execution_time, records_processed, 
        success, error, duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      jobType,
      new Date().toISOString(),
      (result as any)?.processed || (result as any)?.stored || 0,
      1,
      null,
      duration
    ).run();
    
    console.log(`Cron job ${jobType} completed in ${duration}ms`);
  } catch (error: any) {
    console.error('Cron job failed:', error);
    
    // Log error to database
    try {
      await env.DB.prepare(`
        INSERT INTO cron_logs (
          job_type, execution_time, records_processed, 
          success, error, duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        'unknown',
        new Date().toISOString(),
        0,
        0,
        error?.message || 'Unknown error',
        Date.now() - startTime
      ).run();
    } catch (dbError) {
      console.error('Failed to log cron error:', dbError);
    }
  }
};

export default {
  fetch: app.fetch,
  scheduled: handleCron,
};

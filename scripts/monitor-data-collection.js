#!/usr/bin/env node

/**
 * DNS Security SOC Dashboard - Data Collection Monitoring Script
 * 
 * This script monitors the data collection process over time to ensure
 * that data is being consistently collected and stored correctly.
 * 
 * It checks:
 * 1. Cron job execution history
 * 2. Data growth trends
 * 3. Error rates
 * 4. Performance metrics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_NAME = process.env.DB_NAME || 'dns-security-db-dev';
const IS_LOCAL = process.env.IS_LOCAL !== 'false';
const DAYS_TO_ANALYZE = parseInt(process.env.DAYS_TO_ANALYZE || '7');
const OUTPUT_DIR = process.env.OUTPUT_DIR || './monitoring-reports';
const localFlag = IS_LOCAL ? '--local' : '--remote';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Print a section header
 */
function printSection(title) {
  console.log(`\n${colors.cyan}=== ${title} ===${colors.reset}\n`);
}

/**
 * Print a success message
 */
function printSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

/**
 * Print an error message
 */
function printError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

/**
 * Print a warning message
 */
function printWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

/**
 * Print an info message
 */
function printInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

/**
 * Execute a D1 query and return the results
 */
function executeQuery(query) {
  try {
    const result = execSync(`npx wrangler d1 execute ${DB_NAME} ${localFlag} --command "${query}"`);
    return result.toString();
  } catch (error) {
    printError(`Failed to execute query: ${error.message}`);
    return null;
  }
}

/**
 * Parse table output from D1 execute command
 */
function parseTableOutput(output) {
  if (!output) return [];
  
  const lines = output.split('\n').filter(line => line.trim());
  
  if (lines.length < 3) {
    return [];
  }
  
  // Skip header and separator lines
  const dataLines = lines.slice(2);
  
  return dataLines.map(line => {
    const parts = line.split('|').map(part => part.trim());
    return parts;
  });
}

/**
 * Get date range for analysis
 */
function getDateRange() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - DAYS_TO_ANALYZE);
  
  return {
    start: startDate.toISOString(),
    end: now.toISOString(),
    days: DAYS_TO_ANALYZE
  };
}

/**
 * Analyze cron job execution
 */
function analyzeCronJobs() {
  printSection('Analyzing Cron Job Execution');
  
  const dateRange = getDateRange();
  
  printInfo(`Analyzing cron jobs from ${dateRange.start} to ${dateRange.end} (${dateRange.days} days)`);
  
  const query = `
    SELECT 
      job_type,
      COUNT(*) as total_executions,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_executions,
      AVG(records_processed) as avg_records_processed,
      AVG(duration_ms) as avg_duration_ms,
      MAX(duration_ms) as max_duration_ms,
      MIN(duration_ms) as min_duration_ms
    FROM cron_logs
    WHERE execution_time >= '${dateRange.start}' AND execution_time <= '${dateRange.end}'
    GROUP BY job_type
  `;
  
  const result = executeQuery(query);
  
  if (!result) {
    return null;
  }
  
  const cronStats = parseTableOutput(result);
  
  if (cronStats.length === 0) {
    printWarning('No cron job executions found in the specified date range');
    return null;
  }
  
  printInfo('Cron Job Statistics:');
  
  const cronData = {};
  
  for (const stat of cronStats) {
    const jobType = stat[0];
    const totalExecutions = parseInt(stat[1]);
    const successfulExecutions = parseInt(stat[2]);
    const failedExecutions = parseInt(stat[3]);
    const avgRecordsProcessed = parseFloat(stat[4]);
    const avgDuration = parseFloat(stat[5]);
    const maxDuration = parseFloat(stat[6]);
    const minDuration = parseFloat(stat[7]);
    
    const successRate = (successfulExecutions / totalExecutions) * 100;
    
    cronData[jobType] = {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      avgRecordsProcessed,
      avgDuration,
      maxDuration,
      minDuration,
      successRate
    };
    
    console.log(`\nJob Type: ${colors.magenta}${jobType}${colors.reset}`);
    console.log(`  Total Executions: ${totalExecutions}`);
    console.log(`  Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`  Avg Records Processed: ${avgRecordsProcessed.toFixed(2)}`);
    console.log(`  Avg Duration: ${avgDuration.toFixed(2)}ms`);
    
    if (successRate < 90) {
      printWarning(`  Low success rate for ${jobType} jobs: ${successRate.toFixed(2)}%`);
    } else {
      printSuccess(`  Good success rate for ${jobType} jobs: ${successRate.toFixed(2)}%`);
    }
  }
  
  // Get recent failures
  const failuresQuery = `
    SELECT job_type, execution_time, error
    FROM cron_logs
    WHERE success = 0 AND execution_time >= '${dateRange.start}' AND execution_time <= '${dateRange.end}'
    ORDER BY execution_time DESC
    LIMIT 5
  `;
  
  const failuresResult = executeQuery(failuresQuery);
  
  if (failuresResult) {
    const failures = parseTableOutput(failuresResult);
    
    if (failures.length > 0) {
      printWarning('\nRecent Failures:');
      
      for (const failure of failures) {
        console.log(`  ${colors.yellow}${failure[0]}${colors.reset} at ${failure[1]}: ${failure[2]}`);
      }
    } else {
      printSuccess('\nNo recent failures found');
    }
  }
  
  return cronData;
}

/**
 * Analyze data growth
 */
function analyzeDataGrowth() {
  printSection('Analyzing Data Growth');
  
  const dateRange = getDateRange();
  
  printInfo(`Analyzing data growth from ${dateRange.start} to ${dateRange.end} (${dateRange.days} days)`);
  
  // Get daily data counts
  const tables = [
    'dns_queries',
    'dns_summaries',
    'threat_intelligence',
    'geographic_analytics',
    'security_events'
  ];
  
  const tableData = {};
  
  for (const table of tables) {
    const query = `
      SELECT 
        date(timestamp) as date,
        COUNT(*) as count
      FROM ${table}
      WHERE timestamp >= '${dateRange.start}' AND timestamp <= '${dateRange.end}'
      GROUP BY date(timestamp)
      ORDER BY date
    `;
    
    const result = executeQuery(query);
    
    if (!result) {
      continue;
    }
    
    const data = parseTableOutput(result);
    
    if (data.length === 0) {
      printInfo(`No data found in ${table} for the specified date range`);
      continue;
    }
    
    tableData[table] = data;
    
    console.log(`\n${colors.magenta}${table}${colors.reset} daily record counts:`);
    
    let previousCount = 0;
    let totalGrowth = 0;
    
    for (const row of data) {
      const date = row[0];
      const count = parseInt(row[1]);
      
      const growth = previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0;
      totalGrowth += growth;
      
      console.log(`  ${date}: ${count} records ${growth !== 0 ? `(${growth > 0 ? '+' : ''}${growth.toFixed(2)}%)` : ''}`);
      
      previousCount = count;
    }
    
    const avgGrowth = totalGrowth / (data.length - 1);
    
    if (data.length > 1) {
      console.log(`  Average daily growth: ${avgGrowth > 0 ? '+' : ''}${avgGrowth.toFixed(2)}%`);
      
      if (avgGrowth < -10) {
        printWarning(`  Significant data decline detected in ${table}`);
      } else if (avgGrowth > 100) {
        printWarning(`  Unusual data growth detected in ${table}`);
      }
    }
  }
  
  return tableData;
}

/**
 * Analyze performance metrics
 */
function analyzePerformanceMetrics() {
  printSection('Analyzing Performance Metrics');
  
  const dateRange = getDateRange();
  
  printInfo(`Analyzing performance metrics from ${dateRange.start} to ${dateRange.end} (${dateRange.days} days)`);
  
  const query = `
    SELECT 
      metric_type,
      COUNT(*) as count,
      AVG(value) as avg_value,
      MAX(value) as max_value,
      MIN(value) as min_value
    FROM performance_metrics
    WHERE timestamp >= '${dateRange.start}' AND timestamp <= '${dateRange.end}'
    GROUP BY metric_type
  `;
  
  const result = executeQuery(query);
  
  if (!result) {
    return null;
  }
  
  const metrics = parseTableOutput(result);
  
  if (metrics.length === 0) {
    printWarning('No performance metrics found in the specified date range');
    return null;
  }
  
  printInfo('Performance Metrics:');
  
  const performanceData = {};
  
  for (const metric of metrics) {
    const metricType = metric[0];
    const count = parseInt(metric[1]);
    const avgValue = parseFloat(metric[2]);
    const maxValue = parseFloat(metric[3]);
    const minValue = parseFloat(metric[4]);
    
    performanceData[metricType] = {
      count,
      avgValue,
      maxValue,
      minValue
    };
    
    console.log(`\nMetric: ${colors.magenta}${metricType}${colors.reset}`);
    console.log(`  Count: ${count}`);
    console.log(`  Average: ${avgValue.toFixed(2)}`);
    console.log(`  Max: ${maxValue.toFixed(2)}`);
    console.log(`  Min: ${minValue.toFixed(2)}`);
    
    // Check for performance issues
    if (metricType === 'graphql_query_time' && avgValue > 2000) {
      printWarning(`  High average GraphQL query time: ${avgValue.toFixed(2)}ms`);
    } else if (metricType === 'api_response_time' && avgValue > 500) {
      printWarning(`  High average API response time: ${avgValue.toFixed(2)}ms`);
    }
  }
  
  // Get trend data for graphql_query_time
  const trendQuery = `
    SELECT 
      date(timestamp) as date,
      AVG(value) as avg_value
    FROM performance_metrics
    WHERE 
      timestamp >= '${dateRange.start}' AND 
      timestamp <= '${dateRange.end}' AND
      metric_type = 'graphql_query_time'
    GROUP BY date(timestamp)
    ORDER BY date
  `;
  
  const trendResult = executeQuery(trendQuery);
  
  if (trendResult) {
    const trendData = parseTableOutput(trendResult);
    
    if (trendData.length > 0) {
      console.log(`\n${colors.magenta}GraphQL Query Time Trend${colors.reset}:`);
      
      for (const row of trendData) {
        const date = row[0];
        const avgValue = parseFloat(row[1]);
        
        console.log(`  ${date}: ${avgValue.toFixed(2)}ms`);
      }
    }
  }
  
  return performanceData;
}

/**
 * Generate monitoring report
 */
function generateReport(cronData, tableData, performanceData) {
  printSection('Generating Monitoring Report');
  
  const dateRange = getDateRange();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = OUTPUT_DIR;
  const reportFile = path.join(reportDir, `monitoring-report-${timestamp}.json`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    dateRange,
    database: DB_NAME,
    environment: IS_LOCAL ? 'development' : 'production',
    cronJobs: cronData,
    dataGrowth: tableData,
    performanceMetrics: performanceData
  };
  
  try {
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    printSuccess(`Report saved to ${reportFile}`);
  } catch (error) {
    printError(`Failed to save report: ${error.message}`);
  }
  
  return reportFile;
}

/**
 * Run all monitoring checks
 */
function runMonitoring() {
  console.log(`${colors.magenta}DNS Security SOC Dashboard - Data Collection Monitoring${colors.reset}`);
  console.log(`${colors.magenta}=====================================================${colors.reset}\n`);
  
  console.log(`Database: ${DB_NAME}`);
  console.log(`Environment: ${IS_LOCAL ? 'Development' : 'Production'}`);
  console.log(`Analysis Period: ${DAYS_TO_ANALYZE} days\n`);
  
  const cronData = analyzeCronJobs();
  const tableData = analyzeDataGrowth();
  const performanceData = analyzePerformanceMetrics();
  
  const reportFile = generateReport(cronData, tableData, performanceData);
  
  printSection('Monitoring Summary');
  
  if (cronData) {
    // Check for critical issues
    let criticalIssues = 0;
    let warnings = 0;
    
    // Check cron job success rates
    for (const [jobType, data] of Object.entries(cronData)) {
      if (data.successRate < 80) {
        printError(`Critical: ${jobType} job has a low success rate (${data.successRate.toFixed(2)}%)`);
        criticalIssues++;
      } else if (data.successRate < 95) {
        printWarning(`Warning: ${jobType} job has a moderate success rate (${data.successRate.toFixed(2)}%)`);
        warnings++;
      }
    }
    
    // Check for missing data
    if (tableData) {
      for (const [table, data] of Object.entries(tableData)) {
        if (data.length === 0) {
          printWarning(`Warning: No data in ${table} for the analysis period`);
          warnings++;
        }
      }
    }
    
    if (criticalIssues === 0 && warnings === 0) {
      printSuccess('No critical issues or warnings detected');
    } else {
      console.log(`\nFound ${criticalIssues} critical issues and ${warnings} warnings`);
    }
  }
  
  console.log(`\nMonitoring report saved to: ${reportFile}`);
}

// Run monitoring
runMonitoring();

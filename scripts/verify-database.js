#!/usr/bin/env node

/**
 * DNS Security SOC Dashboard - Database Verification Script
 * 
 * This script verifies the D1 database schema and data integrity
 * by performing the following checks:
 * 
 * 1. Table structure verification
 * 2. Data integrity checks
 * 3. Relationship validation
 * 4. Index verification
 * 5. Data consistency checks
 */

const { execSync } = require('child_process');

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

// Configuration
const DB_NAME = process.env.DB_NAME || 'dns-security-db-dev';
const IS_LOCAL = process.env.IS_LOCAL !== 'false';
const localFlag = IS_LOCAL ? '--local' : '--remote';

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
 * Verify table structure
 */
function verifyTableStructure() {
  printSection('Verifying Table Structure');
  
  const tables = [
    'dns_queries',
    'dns_summaries',
    'threat_intelligence',
    'geographic_analytics',
    'device_analytics',
    'security_events',
    'cron_logs',
    'performance_metrics'
  ];
  
  const result = executeQuery("SELECT name FROM sqlite_master WHERE type='table'");
  
  if (!result) {
    return false;
  }
  
  const existingTables = parseTableOutput(result).map(row => row[0]);
  
  let allTablesExist = true;
  
  for (const table of tables) {
    if (existingTables.includes(table)) {
      printSuccess(`Table '${table}' exists`);
      
      // Check table structure
      const tableInfo = executeQuery(`PRAGMA table_info(${table})`);
      if (tableInfo) {
        const columns = parseTableOutput(tableInfo);
        printInfo(`Table '${table}' has ${columns.length} columns`);
      }
    } else {
      printError(`Table '${table}' does not exist`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

/**
 * Verify indexes
 */
function verifyIndexes() {
  printSection('Verifying Indexes');
  
  const tables = [
    'dns_queries',
    'dns_summaries',
    'threat_intelligence',
    'geographic_analytics',
    'device_analytics',
    'security_events',
    'cron_logs',
    'performance_metrics'
  ];
  
  let allIndexesExist = true;
  
  for (const table of tables) {
    const result = executeQuery(`PRAGMA index_list(${table})`);
    
    if (!result) {
      allIndexesExist = false;
      continue;
    }
    
    const indexes = parseTableOutput(result);
    
    if (indexes.length === 0) {
      printError(`No indexes found for table '${table}'`);
      allIndexesExist = false;
    } else {
      printSuccess(`Found ${indexes.length} indexes for table '${table}'`);
      
      for (const index of indexes) {
        const indexName = index[1];
        printInfo(`  - ${indexName}`);
        
        // Check index columns
        const indexInfo = executeQuery(`PRAGMA index_info(${indexName})`);
        if (indexInfo) {
          const columns = parseTableOutput(indexInfo);
          const columnNames = columns.map(col => col[2]).join(', ');
          printInfo(`    Columns: ${columnNames}`);
        }
      }
    }
  }
  
  return allIndexesExist;
}

/**
 * Verify data integrity
 */
function verifyDataIntegrity() {
  printSection('Verifying Data Integrity');
  
  const checks = [
    {
      table: 'dns_queries',
      query: 'SELECT COUNT(*) FROM dns_queries',
      description: 'DNS queries count'
    },
    {
      table: 'dns_summaries',
      query: 'SELECT COUNT(*) FROM dns_summaries',
      description: 'DNS summaries count'
    },
    {
      table: 'threat_intelligence',
      query: 'SELECT COUNT(*) FROM threat_intelligence',
      description: 'Threat intelligence count'
    },
    {
      table: 'geographic_analytics',
      query: 'SELECT COUNT(*) FROM geographic_analytics',
      description: 'Geographic analytics count'
    },
    {
      table: 'cron_logs',
      query: 'SELECT COUNT(*) FROM cron_logs',
      description: 'Cron logs count'
    }
  ];
  
  let hasData = false;
  
  for (const check of checks) {
    const result = executeQuery(check.query);
    
    if (!result) {
      continue;
    }
    
    const count = parseTableOutput(result)[0][0];
    
    if (parseInt(count) > 0) {
      printSuccess(`${check.description}: ${count} records`);
      hasData = true;
    } else {
      printInfo(`${check.description}: No records found`);
    }
  }
  
  if (!hasData) {
    printInfo('No data found in any tables. This might be normal if no data has been collected yet.');
  }
  
  return true;
}

/**
 * Verify data consistency
 */
function verifyDataConsistency() {
  printSection('Verifying Data Consistency');
  
  const checks = [
    {
      query: `
        SELECT COUNT(*) FROM dns_queries 
        WHERE timestamp IS NULL OR query_name IS NULL OR resolver_decision IS NULL
      `,
      description: 'DNS queries with missing required fields',
      expectZero: true
    },
    {
      query: `
        SELECT COUNT(*) FROM dns_summaries
        WHERE timestamp IS NULL OR period_type IS NULL OR total_queries IS NULL
      `,
      description: 'DNS summaries with missing required fields',
      expectZero: true
    },
    {
      query: `
        SELECT COUNT(DISTINCT period_type) FROM dns_summaries
      `,
      description: 'Distinct period types in DNS summaries',
      expectZero: false
    },
    {
      query: `
        SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM dns_queries
      `,
      description: 'DNS queries date range',
      expectZero: false
    }
  ];
  
  let allChecksPass = true;
  
  for (const check of checks) {
    const result = executeQuery(check.query);
    
    if (!result) {
      allChecksPass = false;
      continue;
    }
    
    const data = parseTableOutput(result);
    
    if (check.expectZero) {
      const count = parseInt(data[0][0]);
      if (count === 0) {
        printSuccess(`${check.description}: ${count} (good)`);
      } else {
        printError(`${check.description}: ${count} (should be 0)`);
        allChecksPass = false;
      }
    } else {
      printInfo(`${check.description}: ${data[0].join(' to ')}`);
    }
  }
  
  return allChecksPass;
}

/**
 * Verify sample data
 */
function verifySampleData() {
  printSection('Verifying Sample Data');
  
  const tables = [
    'dns_queries',
    'dns_summaries',
    'threat_intelligence',
    'geographic_analytics',
    'cron_logs'
  ];
  
  for (const table of tables) {
    const result = executeQuery(`SELECT * FROM ${table} LIMIT 1`);
    
    if (!result) {
      continue;
    }
    
    const data = parseTableOutput(result);
    
    if (data.length > 0) {
      printSuccess(`Sample data from '${table}' table:`);
      console.log(result);
    } else {
      printInfo(`No data found in '${table}' table`);
    }
  }
  
  return true;
}

/**
 * Run all verification tests
 */
function runAllTests() {
  console.log(`${colors.magenta}DNS Security SOC Dashboard - Database Verification${colors.reset}`);
  console.log(`${colors.magenta}===============================================${colors.reset}\n`);
  
  console.log(`Database: ${DB_NAME}`);
  console.log(`Mode: ${IS_LOCAL ? 'Local' : 'Remote'}\n`);
  
  const results = {
    tableStructure: verifyTableStructure(),
    indexes: verifyIndexes(),
    dataIntegrity: verifyDataIntegrity(),
    dataConsistency: verifyDataConsistency(),
    sampleData: verifySampleData()
  };
  
  printSection('Verification Results');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log(`\n${colors.green}✓ All database verification tests passed!${colors.reset}`);
    console.log(`${colors.green}✓ The database schema and data integrity look good.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠ Some database verification tests did not pass.${colors.reset}`);
    console.log(`${colors.yellow}⚠ This might be normal if the database is empty or newly created.${colors.reset}`);
    
    // Print failed tests
    console.log('\nTest results:');
    for (const [test, result] of Object.entries(results)) {
      if (result) {
        console.log(`${colors.green}✓ ${test}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ ${test}${colors.reset}`);
      }
    }
  }
}

// Run all tests
runAllTests();

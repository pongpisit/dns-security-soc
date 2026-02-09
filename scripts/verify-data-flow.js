#!/usr/bin/env node

/**
 * DNS Security SOC Dashboard - Data Flow Verification Script
 * 
 * This script verifies the entire data flow from Cloudflare GraphQL API to D1 storage
 * by performing the following checks:
 * 
 * 1. API connectivity and authentication
 * 2. GraphQL query execution
 * 3. Data processing
 * 4. D1 database storage
 * 5. API endpoint functionality
 */

const { execSync } = require('child_process');
const fetch = require('node-fetch');

// Configuration
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
  console.error('❌ Error: CF_API_TOKEN and CF_ACCOUNT_ID environment variables must be set');
  process.exit(1);
}

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
 * Print an info message
 */
function printInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

/**
 * Test direct GraphQL API connectivity
 */
async function testGraphQLConnectivity() {
  printSection('Testing Cloudflare GraphQL API Connectivity');
  
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query TestBasicGraphQL($accountTag: string!) {
            viewer {
              accounts(filter: {accountTag: $accountTag}) {
                gatewayResolverQueriesAdaptiveGroups(
                  filter: {
                    datetime_geq: "${oneHourAgo.toISOString()}"
                    datetime_leq: "${now.toISOString()}"
                  }
                  limit: 5
                ) {
                  count
                  dimensions {
                    queryName
                    resolverDecision
                  }
                }
              }
            }
          }
        `,
        variables: {
          accountTag: CF_ACCOUNT_ID
        }
      }),
    });
    
    const data = await response.json();
    
    if (data.errors) {
      printError(`GraphQL API returned errors: ${JSON.stringify(data.errors)}`);
      return false;
    }
    
    const queries = data.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
    
    if (queries.length === 0) {
      printInfo('No DNS queries found in the last hour. This might be normal if there is no traffic.');
    } else {
      printSuccess(`Found ${queries.length} DNS queries in the last hour`);
      printInfo(`Sample query: ${queries[0].dimensions.queryName}`);
    }
    
    return true;
  } catch (error) {
    printError(`Failed to connect to GraphQL API: ${error.message}`);
    return false;
  }
}

/**
 * Test worker health endpoint
 */
async function testWorkerHealth() {
  printSection('Testing Worker Health');
  
  try {
    const response = await fetch(`${WORKER_URL}/api/health`);
    const data = await response.json();
    
    if (!data.success) {
      printError(`Health check failed: ${data.error}`);
      return false;
    }
    
    printSuccess('Worker health check passed');
    printInfo(`Database status: ${data.data.database}`);
    printInfo(`KV status: ${data.data.kv}`);
    printInfo(`Environment: ${data.data.environment}`);
    
    return true;
  } catch (error) {
    printError(`Failed to connect to worker: ${error.message}`);
    return false;
  }
}

/**
 * Test manual data collection
 */
async function testDataCollection() {
  printSection('Testing Manual Data Collection');
  
  try {
    const response = await fetch(`${WORKER_URL}/api/collect?type=realtime`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      printError(`Data collection failed: ${data.error}`);
      return false;
    }
    
    printSuccess(`Data collection successful`);
    printInfo(`Processed ${data.data.processed} records`);
    printInfo(`Stored ${data.data.stored} records`);
    printInfo(`Duration: ${data.data.duration}ms`);
    
    return data.data.stored > 0;
  } catch (error) {
    printError(`Failed to trigger data collection: ${error.message}`);
    return false;
  }
}

/**
 * Test dashboard data retrieval
 */
async function testDashboardData() {
  printSection('Testing Dashboard Data Retrieval');
  
  try {
    const response = await fetch(`${WORKER_URL}/api/dashboard/overview`);
    const data = await response.json();
    
    if (!data.success) {
      printError(`Dashboard data retrieval failed: ${data.error}`);
      return false;
    }
    
    printSuccess('Dashboard data retrieval successful');
    printInfo(`Total queries (24h): ${data.data.total_queries_24h}`);
    printInfo(`Blocked queries (24h): ${data.data.blocked_queries_24h}`);
    printInfo(`Threat detection rate: ${data.data.threat_detection_rate}%`);
    printInfo(`Unique threats (24h): ${data.data.unique_threats_24h}`);
    
    return true;
  } catch (error) {
    printError(`Failed to retrieve dashboard data: ${error.message}`);
    return false;
  }
}

/**
 * Test raw query data retrieval
 */
async function testQueryData() {
  printSection('Testing Raw Query Data Retrieval');
  
  try {
    const response = await fetch(`${WORKER_URL}/api/queries?limit=5`);
    const data = await response.json();
    
    if (!data.success) {
      printError(`Query data retrieval failed: ${data.error}`);
      return false;
    }
    
    const queries = data.data;
    
    if (queries.length === 0) {
      printInfo('No query data found. This might be normal if no data has been collected yet.');
      return true;
    }
    
    printSuccess(`Retrieved ${queries.length} queries`);
    printInfo(`Total records: ${data.meta.total}`);
    
    // Print sample query
    const sampleQuery = queries[0];
    console.log('\nSample query:');
    console.log(JSON.stringify(sampleQuery, null, 2));
    
    return true;
  } catch (error) {
    printError(`Failed to retrieve query data: ${error.message}`);
    return false;
  }
}

/**
 * Test D1 database directly using wrangler
 */
async function testD1Database() {
  printSection('Testing D1 Database Directly');
  
  try {
    // Execute a simple query to check if tables exist
    const result = execSync('npx wrangler d1 execute dns-security-db-dev --local --command "SELECT name FROM sqlite_master WHERE type=\'table\'"');
    
    console.log(result.toString());
    
    // Check if dns_queries table has data
    try {
      const queryResult = execSync('npx wrangler d1 execute dns-security-db-dev --local --command "SELECT COUNT(*) as count FROM dns_queries"');
      const output = queryResult.toString();
      
      if (output.includes('count')) {
        const countMatch = output.match(/count\s*\|\s*(\d+)/);
        if (countMatch && countMatch[1]) {
          const count = parseInt(countMatch[1]);
          printSuccess(`dns_queries table contains ${count} records`);
        }
      }
    } catch (dbError) {
      printError(`Failed to query dns_queries table: ${dbError.message}`);
    }
    
    return true;
  } catch (error) {
    printError(`Failed to access D1 database: ${error.message}`);
    return false;
  }
}

/**
 * Run all verification tests
 */
async function runAllTests() {
  console.log(`${colors.magenta}DNS Security SOC Dashboard - Data Flow Verification${colors.reset}`);
  console.log(`${colors.magenta}==================================================${colors.reset}\n`);
  
  const results = {
    graphqlConnectivity: await testGraphQLConnectivity(),
    workerHealth: await testWorkerHealth(),
    dataCollection: await testDataCollection(),
    dashboardData: await testDashboardData(),
    queryData: await testQueryData(),
    d1Database: await testD1Database()
  };
  
  printSection('Verification Results');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log(`\n${colors.green}✓ All verification tests passed!${colors.reset}`);
    console.log(`${colors.green}✓ The data flow from Cloudflare GraphQL API to D1 storage is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some verification tests failed.${colors.reset}`);
    console.log(`${colors.red}✗ Please check the errors above and fix the issues.${colors.reset}`);
    
    // Print failed tests
    console.log('\nFailed tests:');
    for (const [test, result] of Object.entries(results)) {
      if (!result) {
        console.log(`${colors.red}✗ ${test}${colors.reset}`);
      }
    }
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});

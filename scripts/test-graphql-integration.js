#!/usr/bin/env node

/**
 * DNS Security SOC Dashboard - GraphQL Integration Test Script
 * 
 * This script tests the Cloudflare GraphQL integration by:
 * 1. Testing direct GraphQL API access
 * 2. Testing the GraphQL service through the worker
 * 3. Comparing results to ensure data consistency
 */

const fetch = require('node-fetch');

// Configuration
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';

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
 * Test direct GraphQL API access
 */
async function testDirectGraphQL() {
  printSection('Testing Direct GraphQL API Access');
  
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    printInfo(`Querying data from ${oneHourAgo.toISOString()} to ${now.toISOString()}`);
    
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetDnsSecurityTelemetry($accountTag: string!, $startTime: string!, $endTime: string!) {
            viewer {
              accounts(filter: {accountTag: $accountTag}) {
                gatewayResolverQueriesAdaptiveGroups(
                  filter: {
                    datetime_geq: $startTime
                    datetime_leq: $endTime
                  }
                  limit: 10
                ) {
                  count
                  dimensions {
                    queryName
                    resolverDecision
                    categoryNames
                    srcIpCountry
                  }
                }
              }
            }
          }
        `,
        variables: {
          accountTag: CF_ACCOUNT_ID,
          startTime: oneHourAgo.toISOString(),
          endTime: now.toISOString()
        }
      }),
    });
    
    const data = await response.json();
    
    if (data.errors) {
      printError(`GraphQL API returned errors: ${JSON.stringify(data.errors)}`);
      return null;
    }
    
    const queries = data.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
    
    if (queries.length === 0) {
      printInfo('No DNS queries found in the last hour. This might be normal if there is no traffic.');
      return [];
    }
    
    printSuccess(`Found ${queries.length} DNS queries in the last hour`);
    
    // Print sample queries
    console.log('\nSample Queries:');
    for (let i = 0; i < Math.min(3, queries.length); i++) {
      const query = queries[i];
      console.log(`\n  Query #${i + 1}:`);
      console.log(`    Domain: ${query.dimensions.queryName}`);
      console.log(`    Decision: ${query.dimensions.resolverDecision}`);
      console.log(`    Categories: ${JSON.stringify(query.dimensions.categoryNames)}`);
      console.log(`    Country: ${query.dimensions.srcIpCountry}`);
      console.log(`    Count: ${query.count}`);
    }
    
    return queries;
  } catch (error) {
    printError(`Failed to connect to GraphQL API: ${error.message}`);
    return null;
  }
}

/**
 * Test worker GraphQL service
 */
async function testWorkerGraphQL() {
  printSection('Testing Worker GraphQL Service');
  
  try {
    // First check if the worker is running
    const healthResponse = await fetch(`${WORKER_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    if (!healthData.success) {
      printError(`Worker health check failed: ${healthData.error}`);
      return null;
    }
    
    printSuccess('Worker health check passed');
    
    // Trigger data collection
    const now = new Date();
    printInfo(`Triggering data collection at ${now.toISOString()}`);
    
    const collectResponse = await fetch(`${WORKER_URL}/api/collect?type=realtime`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`
      }
    });
    
    const collectData = await collectResponse.json();
    
    if (!collectData.success) {
      printError(`Data collection failed: ${collectData.error}`);
      return null;
    }
    
    printSuccess(`Data collection successful: Processed ${collectData.data.processed} records`);
    
    // Get dashboard data
    const dashboardResponse = await fetch(`${WORKER_URL}/api/dashboard/overview`);
    const dashboardData = await dashboardResponse.json();
    
    if (!dashboardData.success) {
      printError(`Dashboard data retrieval failed: ${dashboardData.error}`);
      return null;
    }
    
    printSuccess('Dashboard data retrieval successful');
    printInfo(`Total queries (24h): ${dashboardData.data.total_queries_24h}`);
    printInfo(`Blocked queries (24h): ${dashboardData.data.blocked_queries_24h}`);
    printInfo(`Threat detection rate: ${dashboardData.data.threat_detection_rate}%`);
    
    // Get raw query data
    const queriesResponse = await fetch(`${WORKER_URL}/api/queries?limit=10`);
    const queriesData = await queriesResponse.json();
    
    if (!queriesData.success) {
      printError(`Query data retrieval failed: ${queriesData.error}`);
      return null;
    }
    
    const queries = queriesData.data;
    
    if (queries.length === 0) {
      printInfo('No query data found. This might be normal if no data has been collected yet.');
      return [];
    }
    
    printSuccess(`Retrieved ${queries.length} queries from worker`);
    
    // Print sample queries
    console.log('\nSample Queries from Worker:');
    for (let i = 0; i < Math.min(3, queries.length); i++) {
      const query = queries[i];
      console.log(`\n  Query #${i + 1}:`);
      console.log(`    Domain: ${query.query_name}`);
      console.log(`    Decision: ${query.resolver_decision}`);
      console.log(`    Risk Score: ${query.risk_score}`);
      console.log(`    Blocked: ${query.blocked ? 'Yes' : 'No'}`);
      console.log(`    Timestamp: ${query.timestamp}`);
    }
    
    return queries;
  } catch (error) {
    printError(`Failed to test worker GraphQL service: ${error.message}`);
    return null;
  }
}

/**
 * Compare GraphQL results
 */
function compareResults(directQueries, workerQueries) {
  printSection('Comparing GraphQL Results');
  
  if (!directQueries || !workerQueries) {
    printError('Cannot compare results: One or both query sets are missing');
    return false;
  }
  
  if (directQueries.length === 0 && workerQueries.length === 0) {
    printInfo('Both direct and worker queries returned empty results. This might be normal if there is no traffic.');
    return true;
  }
  
  if (directQueries.length === 0) {
    printInfo('Direct GraphQL queries returned empty results, but worker queries returned data.');
    printInfo('This might indicate that the worker is using cached data or data from a different time range.');
    return true;
  }
  
  if (workerQueries.length === 0) {
    printError('Worker queries returned empty results, but direct GraphQL queries returned data.');
    printError('This might indicate an issue with data processing or storage in the worker.');
    return false;
  }
  
  // Check if domains from direct queries exist in worker queries
  const directDomains = new Set(directQueries.map(q => q.dimensions.queryName));
  const workerDomains = new Set(workerQueries.map(q => q.query_name));
  
  let domainsFound = 0;
  
  for (const domain of directDomains) {
    if (workerDomains.has(domain)) {
      domainsFound++;
    }
  }
  
  const domainOverlapPercentage = (domainsFound / directDomains.size) * 100;
  
  if (domainOverlapPercentage >= 50) {
    printSuccess(`Domain overlap: ${domainOverlapPercentage.toFixed(2)}% (${domainsFound}/${directDomains.size})`);
  } else if (domainOverlapPercentage > 0) {
    printInfo(`Partial domain overlap: ${domainOverlapPercentage.toFixed(2)}% (${domainsFound}/${directDomains.size})`);
    printInfo('This might be normal if the worker is using a different time range or if data is still being processed.');
  } else {
    printError('No domain overlap between direct GraphQL queries and worker queries.');
    printError('This might indicate an issue with data processing or storage in the worker.');
    return false;
  }
  
  return true;
}

/**
 * Test GraphQL dimensions
 */
async function testGraphQLDimensions() {
  printSection('Testing GraphQL Dimensions');
  
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    printInfo('Testing comprehensive GraphQL dimensions...');
    
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query TestGraphQLDimensions($accountTag: string!, $startTime: string!, $endTime: string!) {
            viewer {
              accounts(filter: {accountTag: $accountTag}) {
                gatewayResolverQueriesAdaptiveGroups(
                  filter: {
                    datetime_geq: $startTime
                    datetime_leq: $endTime
                  }
                  limit: 1
                ) {
                  dimensions {
                    # Basic query information
                    queryName
                    queryNameReversed
                    datetime
                    
                    # Security-focused dimensions
                    resolverDecision
                    categoryNames
                    policyId
                    policyName
                    matchedApplicationName
                    matchedIndicatorFeedNames
                    
                    # Network dimensions
                    resolvedIps
                    cnames
                    authoritativeNameserverIps
                    resourceRecordTypes
                    customResolverResponseCode
                    
                    # Geographic dimensions
                    srcIpCountry
                    srcIpContinent
                    resolvedIpCountries
                    locationName
                    
                    # User/device information
                    deviceName
                    userEmail
                  }
                }
              }
            }
          }
        `,
        variables: {
          accountTag: CF_ACCOUNT_ID,
          startTime: oneHourAgo.toISOString(),
          endTime: now.toISOString()
        }
      }),
    });
    
    const data = await response.json();
    
    if (data.errors) {
      printError(`GraphQL API returned errors: ${JSON.stringify(data.errors)}`);
      return false;
    }
    
    const dimensions = data.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups[0]?.dimensions;
    
    if (!dimensions) {
      printInfo('No data available to test dimensions. This might be normal if there is no traffic.');
      return true;
    }
    
    // Check which dimensions are available
    const availableDimensions = Object.keys(dimensions).filter(key => {
      const value = dimensions[key];
      return value !== null && value !== undefined && 
             (typeof value !== 'object' || Object.keys(value).length > 0 || Array.isArray(value) && value.length > 0);
    });
    
    printSuccess(`Found ${availableDimensions.length} available dimensions`);
    
    // Group dimensions by category
    const dimensionCategories = {
      basic: ['queryName', 'queryNameReversed', 'datetime'],
      security: ['resolverDecision', 'categoryNames', 'policyId', 'policyName', 'matchedApplicationName', 'matchedIndicatorFeedNames'],
      network: ['resolvedIps', 'cnames', 'authoritativeNameserverIps', 'resourceRecordTypes', 'customResolverResponseCode'],
      geographic: ['srcIpCountry', 'srcIpContinent', 'resolvedIpCountries', 'locationName'],
      user: ['deviceName', 'userEmail']
    };
    
    // Check coverage by category
    for (const [category, dims] of Object.entries(dimensionCategories)) {
      const available = dims.filter(dim => availableDimensions.includes(dim));
      const percentage = (available.length / dims.length) * 100;
      
      console.log(`\n${colors.magenta}${category.charAt(0).toUpperCase() + category.slice(1)} Dimensions${colors.reset}:`);
      console.log(`  Coverage: ${percentage.toFixed(2)}% (${available.length}/${dims.length})`);
      
      if (available.length > 0) {
        console.log('  Available:');
        for (const dim of available) {
          const value = dimensions[dim];
          const displayValue = Array.isArray(value) ? 
            `[${value.join(', ')}]` : 
            (typeof value === 'object' ? JSON.stringify(value) : value);
          console.log(`    - ${dim}: ${displayValue}`);
        }
      }
      
      if (available.length < dims.length) {
        const missing = dims.filter(dim => !availableDimensions.includes(dim));
        console.log('  Missing:');
        for (const dim of missing) {
          console.log(`    - ${dim}`);
        }
      }
    }
    
    // Overall assessment
    const totalDimensions = Object.values(dimensionCategories).flat().length;
    const totalAvailable = availableDimensions.filter(dim => 
      Object.values(dimensionCategories).flat().includes(dim)
    ).length;
    const overallPercentage = (totalAvailable / totalDimensions) * 100;
    
    console.log(`\nOverall dimension coverage: ${overallPercentage.toFixed(2)}% (${totalAvailable}/${totalDimensions})`);
    
    if (overallPercentage >= 80) {
      printSuccess('Excellent dimension coverage (80%+)');
    } else if (overallPercentage >= 50) {
      printInfo('Good dimension coverage (50%+)');
    } else {
      printError('Poor dimension coverage (below 50%)');
    }
    
    return true;
  } catch (error) {
    printError(`Failed to test GraphQL dimensions: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`${colors.magenta}DNS Security SOC Dashboard - GraphQL Integration Test${colors.reset}`);
  console.log(`${colors.magenta}=================================================${colors.reset}\n`);
  
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Account ID: ${CF_ACCOUNT_ID.substring(0, 6)}...${CF_ACCOUNT_ID.substring(CF_ACCOUNT_ID.length - 4)}`);
  console.log(`API Token: ${CF_API_TOKEN.substring(0, 3)}...${CF_API_TOKEN.substring(CF_API_TOKEN.length - 3)}\n`);
  
  // Test direct GraphQL access
  const directQueries = await testDirectGraphQL();
  
  // Test GraphQL dimensions
  await testGraphQLDimensions();
  
  // Test worker GraphQL service
  const workerQueries = await testWorkerGraphQL();
  
  // Compare results
  const comparisonResult = compareResults(directQueries, workerQueries);
  
  printSection('Test Results');
  
  if (directQueries !== null && (workerQueries !== null && comparisonResult)) {
    console.log(`\n${colors.green}✓ All GraphQL integration tests passed!${colors.reset}`);
    console.log(`${colors.green}✓ The backend is correctly retrieving and processing data from Cloudflare GraphQL API.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some GraphQL integration tests failed.${colors.reset}`);
    console.log(`${colors.red}✗ Please check the errors above and fix the issues.${colors.reset}`);
    
    // Print failed tests
    console.log('\nTest results:');
    console.log(`  Direct GraphQL Access: ${directQueries !== null ? colors.green + '✓ Passed' + colors.reset : colors.red + '✗ Failed' + colors.reset}`);
    console.log(`  Worker GraphQL Service: ${workerQueries !== null ? colors.green + '✓ Passed' + colors.reset : colors.red + '✗ Failed' + colors.reset}`);
    console.log(`  Results Comparison: ${comparisonResult ? colors.green + '✓ Passed' + colors.reset : colors.red + '✗ Failed' + colors.reset}`);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});

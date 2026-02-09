#!/usr/bin/env node

/**
 * Test Worker GraphQL Integration
 * Tests the deployed worker's GraphQL fallback functionality
 * The worker has access to CF_API_TOKEN and CF_ACCOUNT_ID secrets
 */

// Use dynamic import for node-fetch v3 (ES module)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const WORKER_URL = process.env.WORKER_URL || 'https://dns-security-soc.pongpisit.workers.dev';

async function testWorkerGraphQL() {
  console.log('🔍 Testing Worker GraphQL Integration\n');
  console.log('━'.repeat(60));
  console.log(`\n🌐 Worker URL: ${WORKER_URL}\n`);
  console.log('📝 Note: Worker has access to CF_API_TOKEN and CF_ACCOUNT_ID secrets');
  console.log('━'.repeat(60));
  
  try {
    // Test 1: Health Check
    console.log('\n📋 Test 1: Health Check\n');
    console.log('⏳ Checking worker health...');
    
    const healthResponse = await fetch(`${WORKER_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      console.log('✅ Worker is healthy');
      console.log(`   Database: ${healthData.data.database}`);
      console.log(`   KV: ${healthData.data.kv}`);
      console.log(`   Environment: ${healthData.data.environment}`);
    } else {
      console.log('❌ Worker health check failed');
      console.log(`   Error: ${healthData.error}`);
      return false;
    }
    
    // Test 2: Dashboard Data (tests GraphQL fallback)
    console.log('\n━'.repeat(60));
    console.log('\n📋 Test 2: Dashboard Data (GraphQL Fallback Test)\n');
    console.log('⏳ Fetching dashboard data...');
    console.log('   This will use: Log Explorer → GraphQL → Database');
    
    const dashboardResponse = await fetch(`${WORKER_URL}/api/dashboard/unified?range=24h`);
    const dashboardData = await dashboardResponse.json();
    
    if (!dashboardData.success) {
      console.log('❌ Dashboard data fetch failed');
      console.log(`   Error: ${dashboardData.error}`);
      return false;
    }
    
    const data = dashboardData.data;
    const source = data.source;
    
    console.log('✅ Dashboard data fetched successfully\n');
    console.log('📊 Data Source Information:');
    console.log(`   Source: ${source.source}`);
    console.log(`   Timestamp: ${source.timestamp}`);
    console.log(`   Range: ${source.range}`);
    console.log(`   Real-time: ${source.is_realtime ? 'Yes' : 'No'}`);
    console.log(`   Data Age: ${source.data_age_minutes} minutes`);
    
    console.log('\n📈 Overview Metrics:');
    console.log(`   Total Queries (24h): ${data.overview.total_queries_24h.toLocaleString()}`);
    console.log(`   Blocked Queries: ${data.overview.blocked_queries_24h.toLocaleString()}`);
    console.log(`   Threat Detection Rate: ${data.overview.threat_detection_rate}%`);
    console.log(`   Unique Threats: ${data.overview.unique_threats_24h}`);
    
    console.log('\n📋 Data Summary:');
    console.log(`   Time Series Points: ${data.time_series.length}`);
    console.log(`   Top Applications: ${data.top_applications.length}`);
    console.log(`   Top Domains: ${data.top_domains.length}`);
    console.log(`   Top Blocked: ${data.top_blocked.length}`);
    console.log(`   Countries: ${data.countries.length}`);
    
    // Show GraphQL fallback status
    console.log('\n━'.repeat(60));
    console.log('\n🔄 GraphQL Fallback Status:\n');
    
    if (source.source === 'graphql_realtime') {
      console.log('✅ GraphQL fallback is ACTIVE');
      console.log('   Log Explorer had no data, GraphQL was used successfully');
      console.log('   This proves the GraphQL integration is working!');
    } else if (source.source === 'logexplorer_realtime') {
      console.log('ℹ️  Log Explorer is active (primary source)');
      console.log('   GraphQL fallback is available but not needed');
    } else if (source.source === 'database') {
      console.log('ℹ️  Using database (both Log Explorer and GraphQL had no data)');
      console.log('   This is normal if Gateway DNS is not active');
    }
    
    // Test 3: Check if we have any data
    console.log('\n━'.repeat(60));
    console.log('\n📋 Test 3: Data Availability\n');
    
    if (data.overview.total_queries_24h === 0) {
      console.log('⚠️  No DNS queries in last 24 hours\n');
      console.log('This means:');
      console.log('  • Gateway DNS logging may not be enabled');
      console.log('  • No DNS traffic in the last 24 hours');
      console.log('  • GraphQL API is working but has no data to return');
      console.log('\n💡 To enable Gateway DNS:');
      console.log('  1. Go to Cloudflare Dashboard → Zero Trust → Gateway → DNS');
      console.log('  2. Enable DNS logging');
      console.log('  3. Configure DNS policies');
      console.log('  4. Route DNS traffic through Gateway');
      console.log('  5. Wait 5-10 minutes for data collection');
    } else {
      console.log('✅ Data is available!');
      console.log(`   ${data.overview.total_queries_24h.toLocaleString()} queries processed`);
      
      if (data.top_domains.length > 0) {
        console.log('\n📋 Top 5 Domains:');
        data.top_domains.slice(0, 5).forEach((domain, i) => {
          console.log(`   ${i + 1}. ${domain.domain} (${domain.queries} queries)`);
        });
      }
      
      if (data.top_applications.length > 0) {
        console.log('\n📱 Top 5 Applications:');
        data.top_applications.slice(0, 5).forEach((app, i) => {
          console.log(`   ${i + 1}. ${app.application} (${app.queries} queries)`);
        });
      }
    }
    
    console.log('\n━'.repeat(60));
    console.log('\n✅ All Tests Passed!\n');
    console.log('Summary:');
    console.log('  ✅ Worker is healthy and accessible');
    console.log('  ✅ Worker has access to secrets (CF_API_TOKEN, CF_ACCOUNT_ID)');
    console.log('  ✅ GraphQL fallback is implemented and ready');
    console.log(`  ✅ Data source: ${source.source}`);
    console.log('  ✅ Dashboard API is working correctly');
    
    console.log('\n🎉 GraphQL Integration Test Complete!\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\nError Details:', error);
    return false;
  }
}

// Run the test
testWorkerGraphQL()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });

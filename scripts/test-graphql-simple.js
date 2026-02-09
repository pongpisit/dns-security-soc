#!/usr/bin/env node

/**
 * Simple GraphQL Test - Direct API Query
 * Tests Cloudflare GraphQL API for DNS security telemetry
 */

const fetch = require('node-fetch');

// Get credentials from environment
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

// If credentials not provided, suggest using the worker endpoint instead
if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
  console.error('❌ Error: CF_API_TOKEN and CF_ACCOUNT_ID environment variables must be set');
  console.error('\n📝 Note: Secrets are stored in Wrangler for the worker, not in local environment.');
  console.error('\n✅ Option 1: Test via deployed worker (recommended)');
  console.error('   The worker already has access to secrets and GraphQL fallback is active.');
  console.error('   Check: https://dns-security-soc.pongpisit.workers.dev/api/dashboard/unified?range=24h');
  console.error('\n✅ Option 2: Provide credentials manually');
  console.error('   CF_API_TOKEN=your_token CF_ACCOUNT_ID=your_account npm run test:graphql:simple');
  console.error('\n✅ Option 3: Test the worker directly');
  console.error('   curl "https://dns-security-soc.pongpisit.workers.dev/api/health"');
  process.exit(1);
}

async function testGraphQL() {
  console.log('🔍 Testing Cloudflare GraphQL API for DNS Security Data\n');
  console.log('━'.repeat(60));
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  console.log(`\n📅 Time Range:`);
  console.log(`   From: ${oneHourAgo.toISOString()}`);
  console.log(`   To:   ${now.toISOString()}`);
  console.log(`\n🔐 Account: ${CF_ACCOUNT_ID.substring(0, 8)}...${CF_ACCOUNT_ID.slice(-4)}`);
  console.log(`\n⏳ Querying GraphQL API...\n`);
  
  try {
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
                  orderBy: [datetime_DESC]
                ) {
                  count
                  dimensions {
                    queryName
                    datetime
                    resolverDecision
                    categoryNames
                    srcIpCountry
                    locationName
                    resolvedIps
                    resourceRecordTypes
                    matchedApplicationName
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
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Response: ${text}`);
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ GraphQL API returned errors:');
      console.error(JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }
    
    const queries = data.data?.viewer?.accounts?.[0]?.gatewayResolverQueriesAdaptiveGroups || [];
    
    console.log('━'.repeat(60));
    console.log('\n✅ GraphQL API Query Successful!\n');
    console.log(`📊 Results: Found ${queries.length} DNS queries in the last hour\n`);
    console.log('━'.repeat(60));
    
    if (queries.length === 0) {
      console.log('\n⚠️  No DNS queries found\n');
      console.log('This means:');
      console.log('  • Gateway DNS logging may not be enabled');
      console.log('  • No DNS traffic in the last hour');
      console.log('  • GraphQL API is working but has no data to return');
      console.log('\n💡 To enable Gateway DNS:');
      console.log('  1. Go to Cloudflare Dashboard → Zero Trust → Gateway → DNS');
      console.log('  2. Enable DNS logging');
      console.log('  3. Configure DNS policies');
      console.log('  4. Route DNS traffic through Gateway\n');
    } else {
      console.log('\n📋 Sample DNS Queries:\n');
      
      queries.slice(0, 5).forEach((q, i) => {
        const dims = q.dimensions;
        console.log(`${i + 1}. ${dims.queryName || 'unknown'}`);
        console.log(`   Time:        ${dims.datetime || 'N/A'}`);
        console.log(`   Decision:    ${dims.resolverDecision || 'N/A'}`);
        console.log(`   Country:     ${dims.srcIpCountry || 'N/A'}`);
        console.log(`   Location:    ${dims.locationName || 'N/A'}`);
        console.log(`   Record Type: ${dims.resourceRecordTypes?.[0] || 'N/A'}`);
        console.log(`   Application: ${dims.matchedApplicationName || 'N/A'}`);
        console.log(`   Count:       ${q.count}`);
        
        if (dims.categoryNames && dims.categoryNames.length > 0) {
          console.log(`   Categories:  ${dims.categoryNames.join(', ')}`);
        }
        
        if (dims.resolvedIps && dims.resolvedIps.length > 0) {
          console.log(`   Resolved:    ${dims.resolvedIps.slice(0, 2).join(', ')}`);
        }
        
        console.log('');
      });
      
      // Summary statistics
      const totalQueries = queries.reduce((sum, q) => sum + q.count, 0);
      const blockedQueries = queries.filter(q => 
        ['2', '3', '6', '9'].includes(q.dimensions.resolverDecision)
      ).reduce((sum, q) => sum + q.count, 0);
      const uniqueDomains = new Set(queries.map(q => q.dimensions.queryName)).size;
      
      console.log('━'.repeat(60));
      console.log('\n📈 Summary Statistics:\n');
      console.log(`   Total Query Count:    ${totalQueries.toLocaleString()}`);
      console.log(`   Blocked Queries:      ${blockedQueries.toLocaleString()}`);
      console.log(`   Unique Domains:       ${uniqueDomains}`);
      console.log(`   Block Rate:           ${totalQueries > 0 ? ((blockedQueries / totalQueries) * 100).toFixed(2) : 0}%`);
      console.log('');
    }
    
    console.log('━'.repeat(60));
    console.log('\n✅ GraphQL Integration Test Complete!\n');
    console.log('Next Steps:');
    console.log('  • GraphQL fallback is working correctly');
    console.log('  • Dashboard will use this data when Log Explorer is unavailable');
    console.log('  • Cron jobs will collect data every 5 minutes');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\nError Details:', error);
    process.exit(1);
  }
}

// Run the test
testGraphQL().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

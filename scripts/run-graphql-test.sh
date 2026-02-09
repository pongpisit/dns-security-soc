#!/bin/bash

# Run GraphQL Test via Worker
# Tests the deployed worker's GraphQL integration
# The worker has access to CF_API_TOKEN and CF_ACCOUNT_ID secrets

set -e

echo "🔍 GraphQL Integration Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Testing deployed worker with GraphQL fallback"
echo "Worker URL: https://dns-security-soc.pongpisit.workers.dev"
echo ""
echo "📝 Note: Worker has access to secrets (CF_API_TOKEN, CF_ACCOUNT_ID)"
echo "         No local credentials needed!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the worker test
node scripts/test-worker-graphql.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test complete!"
echo ""

#!/bin/bash

# Test script for Log Explorer deployment
WORKER_URL="https://dns-security-soc.pongpisit.workers.dev"
PASSED=0
FAILED=0

echo "🧪 Testing DNS Security SOC - Log Explorer Deployment"
echo "======================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_endpoint() {
  local name=$1
  local endpoint=$2
  local expected=$3
  
  echo -n "Testing $name... "
  response=$(curl -s "$WORKER_URL$endpoint")
  
  if echo "$response" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAILED${NC}"
    echo "   Response: $response"
    ((FAILED++))
    return 1
  fi
}

# Test 1: Health Check
test_endpoint "Health Check" "/api/health" "success"

# Test 2: Verify Log Explorer is enabled
echo -n "Verifying Log Explorer is enabled... "
response=$(curl -s "$WORKER_URL/api/health")
if echo "$response" | grep -q "logexplorer_realtime"; then
  echo -e "${GREEN}✅ PASSED${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠️  WARNING: Using fallback data source${NC}"
  echo "   Response: $response"
fi

# Test 3: Dashboard Overview
test_endpoint "Dashboard Overview" "/api/dashboard/overview" "total_queries"

# Test 4: Time Series (1 hour)
test_endpoint "Time Series (1h)" "/api/dashboard/time-series?range=1h" "time_series"

# Test 5: Geographic Data
test_endpoint "Geographic Data" "/api/dashboard/geographic?range=24h" "geographic"

# Test 6: Top Threats
test_endpoint "Top Threats" "/api/dashboard/top-threats?limit=10" "threats"

# Test 7: API Documentation
test_endpoint "API Documentation" "/api-docs" "openapi"

echo ""
echo "======================================"
echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo ""

# Additional checks
echo "📊 Additional Checks"
echo "===================="

# Check database
echo -n "Checking database records... "
db_result=$(wrangler d1 execute dns-security-soc --remote \
  --command "SELECT COUNT(*) as count FROM dns_queries" 2>/dev/null | grep -o '[0-9]\+' | tail -1)

if [ -n "$db_result" ]; then
  echo -e "${GREEN}✅ Found $db_result records${NC}"
else
  echo -e "${YELLOW}⚠️  Could not query database${NC}"
fi

# Check cron logs
echo -n "Checking cron job logs... "
cron_result=$(wrangler d1 execute dns-security-soc --remote \
  --command "SELECT COUNT(*) as count FROM cron_logs WHERE success = 1" 2>/dev/null | grep -o '[0-9]\+' | tail -1)

if [ -n "$cron_result" ]; then
  echo -e "${GREEN}✅ Found $cron_result successful cron executions${NC}"
else
  echo -e "${YELLOW}⚠️  Could not query cron logs${NC}"
fi

echo ""
echo "======================================"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Monitor logs: wrangler tail --format=pretty"
  echo "2. Wait for cron jobs to run (every 5 minutes)"
  echo "3. Check dashboard: $WORKER_URL"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check logs: wrangler tail"
  echo "2. Verify secrets: wrangler secret list"
  echo "3. Check Gateway DNS logging is enabled"
  echo "4. Review: docs/logexplorer-testing-guide.md"
  exit 1
fi

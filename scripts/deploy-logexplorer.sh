#!/bin/bash

# Deployment script for Log Explorer migration
# This script deploys the DNS Security SOC dashboard with Log Explorer integration

set -e

echo "🚀 DNS Security SOC - Log Explorer Migration Deployment"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Please install it first:${NC}"
    echo "   npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✅ Wrangler CLI found${NC}"
echo ""

# Check authentication
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Cloudflare${NC}"
    echo "   Please run: wrangler login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
echo ""

# Check environment variables
echo "🔍 Checking required secrets..."
REQUIRED_SECRETS=("CF_API_TOKEN" "CF_ACCOUNT_ID")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! wrangler secret list 2>/dev/null | grep -q "$secret"; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Missing secrets: ${MISSING_SECRETS[*]}${NC}"
    echo ""
    echo "Please set the missing secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   wrangler secret put $secret"
    done
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ All required secrets are set${NC}"
fi
echo ""

# Ask about feature flag
echo "🎛️  Log Explorer Feature Flag"
echo "----------------------------"
echo "The USE_LOG_EXPLORER environment variable controls which data source to use:"
echo "  - 'true' (default): Use Log Explorer API"
echo "  - 'false': Use GraphQL API (fallback)"
echo ""
read -p "Enable Log Explorer? (Y/n) " -n 1 -r
echo
USE_LOG_EXPLORER="true"
if [[ $REPLY =~ ^[Nn]$ ]]; then
    USE_LOG_EXPLORER="false"
fi

echo -e "${GREEN}Setting USE_LOG_EXPLORER=${USE_LOG_EXPLORER}${NC}"
echo ""

# Build the project
echo "🔨 Building project..."
if npm run build &> /dev/null; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${YELLOW}⚠️  No build script found or build failed${NC}"
fi
echo ""

# Deploy to Cloudflare Workers
echo "📦 Deploying to Cloudflare Workers..."
if wrangler deploy; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo ""

# Set environment variable
echo "⚙️  Setting environment variables..."
if wrangler secret put USE_LOG_EXPLORER <<< "$USE_LOG_EXPLORER"; then
    echo -e "${GREEN}✅ Environment variable set${NC}"
else
    echo -e "${YELLOW}⚠️  Failed to set environment variable${NC}"
fi
echo ""

# Get deployment URL
WORKER_URL=$(wrangler deployments list --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WORKER_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not determine worker URL${NC}"
    echo "   Check your wrangler.toml for the worker name"
else
    echo -e "${GREEN}✅ Worker deployed successfully${NC}"
    echo ""
    echo "🌐 Deployment URLs:"
    echo "   Worker: $WORKER_URL"
    echo "   Health: $WORKER_URL/api/health"
    echo "   Dashboard: $WORKER_URL/api/dashboard/overview"
fi
echo ""

# Test the deployment
echo "🧪 Testing deployment..."
if [ -n "$WORKER_URL" ]; then
    echo "Testing health endpoint..."
    if curl -s "$WORKER_URL/api/health" | grep -q "success"; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
    fi
    echo ""
fi

# Summary
echo "📊 Deployment Summary"
echo "===================="
echo "✅ Worker deployed"
echo "✅ Using Log Explorer: $USE_LOG_EXPLORER"
echo ""
echo "Next steps:"
echo "1. Verify the deployment: curl $WORKER_URL/api/health"
echo "2. Check cron jobs are running: wrangler tail"
echo "3. Monitor logs: wrangler tail --format=pretty"
echo "4. Test data collection: curl -X POST $WORKER_URL/api/collect"
echo ""
echo "📚 Documentation:"
echo "   - Migration Guide: docs/logexplorer-migration-guide.md"
echo "   - API Documentation: $WORKER_URL/api-docs"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"

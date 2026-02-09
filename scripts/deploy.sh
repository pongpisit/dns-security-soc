#!/bin/bash

# DNS Security SOC Dashboard - Deployment Script
# This script automates the deployment process for the DNS Security SOC Dashboard

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-"development"}

echo -e "${BLUE}DNS Security SOC Dashboard - Deployment Script${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""
echo -e "Deploying to: ${YELLOW}$ENVIRONMENT${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}Error: wrangler is not installed.${NC}"
  echo -e "Please install wrangler first:"
  echo -e "npm install -g wrangler"
  exit 1
fi

# Check if user is logged in to Cloudflare
echo -e "${YELLOW}Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
  echo -e "${RED}Error: You are not logged in to Cloudflare.${NC}"
  echo -e "Please login first:"
  echo -e "wrangler login"
  exit 1
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"

# Check if secrets are set
echo -e "${YELLOW}Checking Wrangler Secrets...${NC}"
SECRETS_CHECK=$(wrangler secret list --env $ENVIRONMENT 2>/dev/null)
if [[ $SECRETS_CHECK == *"CF_API_TOKEN"* ]] && [[ $SECRETS_CHECK == *"CF_ACCOUNT_ID"* ]]; then
  echo -e "${GREEN}✅ Required secrets are set${NC}"
else
  echo -e "${RED}❌ Required secrets are missing${NC}"
  echo -e "Please set up secrets first:"
  echo -e "npm run setup:secrets"
  exit 1
fi

# Pre-deployment checks
echo -e "${YELLOW}Running pre-deployment checks...${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Are you in the correct directory?${NC}"
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Build the project (if there's a build script)
if npm run build &> /dev/null; then
  echo -e "${GREEN}✅ Project built successfully${NC}"
fi

# Apply database migrations
echo -e "${YELLOW}Applying database migrations...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
  npm run db:migrate:prod
else
  npm run db:migrate
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database migrations applied${NC}"
else
  echo -e "${RED}❌ Database migration failed${NC}"
  exit 1
fi

# Deploy the worker
echo -e "${YELLOW}Deploying worker to $ENVIRONMENT...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
  wrangler deploy --env production
else
  wrangler deploy --env development
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Worker deployed successfully${NC}"
else
  echo -e "${RED}❌ Worker deployment failed${NC}"
  exit 1
fi

# Get the worker URL
WORKER_URL=$(wrangler whoami 2>/dev/null | grep -o 'https://[^/]*\.workers\.dev' | head -1)
if [ -z "$WORKER_URL" ]; then
  if [ "$ENVIRONMENT" = "production" ]; then
    WORKER_URL="https://dns-security-soc.your-subdomain.workers.dev"
  else
    WORKER_URL="http://localhost:8787"
  fi
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Environment: $ENVIRONMENT"
echo -e "  Worker URL: $WORKER_URL"
echo -e "  Database: $([ "$ENVIRONMENT" = "production" ] && echo "dns-security-db" || echo "dns-security-db-dev")"
echo ""

# Post-deployment verification
echo -e "${YELLOW}Running post-deployment verification...${NC}"

# Wait a moment for the deployment to propagate
sleep 5

# Test the health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$WORKER_URL/api/health" 2>/dev/null)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${YELLOW}⚠️  Health check failed or worker not ready yet${NC}"
  echo -e "You can manually test: curl $WORKER_URL/api/health"
fi

# Suggest next steps
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Run full verification:"
echo -e "   ${YELLOW}WORKER_URL=$WORKER_URL npm run verify:run${NC}"
echo ""
echo -e "2. Test the API endpoints:"
echo -e "   ${YELLOW}curl $WORKER_URL/api/health${NC}"
echo -e "   ${YELLOW}curl $WORKER_URL/api/dashboard/overview${NC}"
echo ""
echo -e "3. Monitor cron jobs:"
echo -e "   ${YELLOW}wrangler tail --env $ENVIRONMENT${NC}"
echo ""
echo -e "4. Check database data:"
echo -e "   ${YELLOW}wrangler d1 execute $([ "$ENVIRONMENT" = "production" ] && echo "dns-security-db" || echo "dns-security-db-dev") --env $ENVIRONMENT --command \"SELECT COUNT(*) as total_queries FROM dns_queries\"${NC}"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${BLUE}Production Deployment Complete!${NC}"
  echo -e "Your DNS Security SOC Dashboard is now live at:"
  echo -e "${GREEN}$WORKER_URL${NC}"
else
  echo -e "${BLUE}Development Deployment Complete!${NC}"
  echo -e "Your development environment is ready for testing."
fi

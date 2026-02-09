#!/bin/bash

# DNS Security SOC Dashboard - Secrets Setup Script
# This script helps to set up Wrangler Secrets for the DNS Security SOC Dashboard

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}DNS Security SOC Dashboard - Secrets Setup${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo ""
echo -e "This script will help you set up Wrangler Secrets for your DNS Security SOC Dashboard."
echo -e "You will need to provide your Cloudflare API token and account ID."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}Error: wrangler is not installed.${NC}"
  echo -e "Please install wrangler first:"
  echo -e "npm install -g wrangler"
  exit 1
fi

# Check if user is logged in to Cloudflare
echo -e "${YELLOW}Checking if you are logged in to Cloudflare...${NC}"
if ! wrangler whoami &> /dev/null; then
  echo -e "${RED}Error: You are not logged in to Cloudflare.${NC}"
  echo -e "Please login first:"
  echo -e "wrangler login"
  exit 1
fi

echo -e "${GREEN}You are logged in to Cloudflare.${NC}"
echo ""

# Ask for API token
echo -e "${YELLOW}Please enter your Cloudflare API token:${NC}"
echo -e "(This token needs GraphQL Analytics, Gateway DNS Analytics, D1, and KV access)"
read -s CF_API_TOKEN
echo ""

if [ -z "$CF_API_TOKEN" ]; then
  echo -e "${RED}Error: API token cannot be empty.${NC}"
  exit 1
fi

# Ask for account ID
echo -e "${YELLOW}Please enter your Cloudflare account ID:${NC}"
read CF_ACCOUNT_ID
echo ""

if [ -z "$CF_ACCOUNT_ID" ]; then
  echo -e "${RED}Error: Account ID cannot be empty.${NC}"
  exit 1
fi

# Ask which environment to set up
echo -e "${YELLOW}Which environment do you want to set up?${NC}"
echo -e "1) Development"
echo -e "2) Production"
echo -e "3) Both"
read -p "Enter your choice (1-3): " ENV_CHOICE
echo ""

# Set up development environment
setup_dev() {
  echo -e "${YELLOW}Setting up secrets for development environment...${NC}"
  
  echo -e "${YELLOW}Setting CF_API_TOKEN...${NC}"
  echo "$CF_API_TOKEN" | wrangler secret put CF_API_TOKEN --env development
  
  echo -e "${YELLOW}Setting CF_ACCOUNT_ID...${NC}"
  echo "$CF_ACCOUNT_ID" | wrangler secret put CF_ACCOUNT_ID --env development
  
  echo -e "${GREEN}Development environment secrets set up successfully.${NC}"
}

# Set up production environment
setup_prod() {
  echo -e "${YELLOW}Setting up secrets for production environment...${NC}"
  
  echo -e "${YELLOW}Setting CF_API_TOKEN...${NC}"
  echo "$CF_API_TOKEN" | wrangler secret put CF_API_TOKEN --env production
  
  echo -e "${YELLOW}Setting CF_ACCOUNT_ID...${NC}"
  echo "$CF_ACCOUNT_ID" | wrangler secret put CF_ACCOUNT_ID --env production
  
  echo -e "${GREEN}Production environment secrets set up successfully.${NC}"
}

# Set up environments based on user choice
case $ENV_CHOICE in
  1)
    setup_dev
    ;;
  2)
    setup_prod
    ;;
  3)
    setup_dev
    setup_prod
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}Secrets setup complete!${NC}"
echo -e "You can now run the verification tools to check if everything is working correctly:"
echo -e "npm run verify:run"

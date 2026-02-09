#!/bin/bash

# Setup Worker Secrets
# This script helps configure CF_API_TOKEN and CF_ACCOUNT_ID as Wrangler secrets

set -e

echo "🔐 Cloudflare Worker Secrets Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will configure the following secrets for your worker:"
echo "  • CF_API_TOKEN  - Your Cloudflare API token"
echo "  • CF_ACCOUNT_ID - Your Cloudflare account ID"
echo ""
echo "These secrets are required for:"
echo "  • GraphQL API queries"
echo "  • Log Explorer API queries"
echo "  • DNS security data collection"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if user wants to proceed
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 1: Setting CF_API_TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "How to get your API Token:"
echo "  1. Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "  2. Click 'Create Token'"
echo "  3. Use template: 'Read Analytics' or create custom with:"
echo "     - Account → Analytics → Read"
echo "     - Account → Gateway → Read"
echo "  4. Copy the token"
echo ""
echo "Running: npx wrangler secret put CF_API_TOKEN"
echo ""

npx wrangler secret put CF_API_TOKEN

echo ""
echo "✅ CF_API_TOKEN set successfully!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 2: Setting CF_ACCOUNT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "How to get your Account ID:"
echo "  1. Go to: https://dash.cloudflare.com"
echo "  2. Select any domain"
echo "  3. Look at the URL: dash.cloudflare.com/[ACCOUNT_ID]/..."
echo "  4. Copy the account ID (32 character hex string)"
echo ""
echo "Running: npx wrangler secret put CF_ACCOUNT_ID"
echo ""

npx wrangler secret put CF_ACCOUNT_ID

echo ""
echo "✅ CF_ACCOUNT_ID set successfully!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secrets Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Verifying secrets..."
echo ""

npx wrangler secret list

echo ""
echo "✅ All secrets configured successfully!"
echo ""
echo "Next steps:"
echo "  1. Deploy your worker: npm run deploy"
echo "  2. Test GraphQL: ./scripts/run-graphql-test.sh"
echo "  3. Check dashboard: https://82ddbf2e.dns-security-dashboard.pages.dev"
echo ""

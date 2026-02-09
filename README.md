# DNS Security SOC Dashboard

> Step-by-step guide to build a real-time DNS security monitoring platform on Cloudflare

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete DNS security monitoring platform with real-time threat detection, analytics dashboard, and network intelligence. Built entirely on Cloudflare's serverless infrastructure.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=DNS+Security+Dashboard)

## What You'll Build

- **Executive Dashboard** - Real-time metrics and security intelligence
- **Threat Detection** - Automatic risk scoring and categorization
- **Network Intelligence** - DNS resolution analysis and cache performance
- **Geographic Tracking** - Query distribution and threat mapping
- **Historical Analytics** - 90+ day data retention with D1 database

## Prerequisites

Before you begin, you'll need:

- **Cloudflare Account** - [Sign up for free](https://dash.cloudflare.com/sign-up)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Wrangler CLI** - Install with `npm install -g wrangler`
- **Git** - For version control

### Required Cloudflare Permissions

Your API token needs:
- Gateway:Read (for DNS data)
- D1:Edit (for database)
- Workers:Edit (for deployment)
- Pages:Edit (for frontend)

## 📋 Implementation Steps

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/dns-security-soc.git
cd dns-security-soc

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Create Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom Token** template
4. Add these permissions:
   - Account → Gateway → Read
   - Account → D1 → Edit
   - Account → Workers Scripts → Edit
   - Account → Pages → Edit
5. Click **Continue to summary** → **Create Token**
6. **Save the token** - you'll need it in Step 4

### Step 3: Create Cloudflare Resources

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create dns-security-db
# Copy the database_id from output

# Create KV namespace
npx wrangler kv namespace create CACHE_KV
# Copy the id from output

# Create Analytics Engine dataset
npx wrangler analytics-engine create dns_security_metrics
```

**Important:** Copy the IDs from each command output. You'll need them next.

### Step 4: Configure Your Project

1. **Update `wrangler.jsonc`** with your resource IDs:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dns-security-db",
      "database_id": "YOUR_DATABASE_ID_HERE"  // ← Paste your D1 ID
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE_KV",
      "id": "YOUR_KV_ID_HERE"  // ← Paste your KV ID
    }
  ]
}
```

2. **Set your secrets**:

```bash
# Set API token (from Step 2)
npx wrangler secret put CF_API_TOKEN
# Paste your token when prompted

# Set account ID (find at dash.cloudflare.com)
npx wrangler secret put CF_ACCOUNT_ID
# Paste your account ID
```

3. **Create `.env` file** (optional, for local development):

```bash
cp .env.example .env
# Edit .env and add your values
```

### Step 5: Initialize Database

```bash
# Apply database migrations
npx wrangler d1 migrations apply dns-security-db --remote

# Verify database is ready
npx wrangler d1 execute dns-security-db --remote --command "SELECT COUNT(*) FROM dns_queries;"
```

Expected output: `COUNT(*) = 0` (empty table, ready to use)

### Step 6: Deploy Backend

```bash
# Deploy Worker to Cloudflare
npm run deploy
```

You'll see output like:
```
✨ Deployment complete!
https://dns-security-soc.YOUR-SUBDOMAIN.workers.dev
```

**Test your backend:**
```bash
curl https://dns-security-soc.YOUR-SUBDOMAIN.workers.dev/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "kv": "connected"
  }
}
```

### Step 7: Deploy Frontend

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=dns-security-dashboard
```

You'll see:
```
✨ Deployment complete!
https://dns-security-dashboard.pages.dev
```

### Step 8: Configure Frontend API URL

Update `frontend/src/services/api.ts` with your Worker URL:

```typescript
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? '/api'
  : 'https://dns-security-soc.YOUR-SUBDOMAIN.workers.dev/api'  // ← Update this
```

Rebuild and redeploy:
```bash
npm run build
npx wrangler pages deploy dist --project-name=dns-security-dashboard
```

### Step 9: Verify Everything Works

Open your dashboard: `https://dns-security-dashboard.pages.dev`

You should see:
- ✅ Executive Summary with metrics
- ✅ Query Activity Trends chart
- ✅ Security Intelligence section
- ✅ Network Intelligence widgets

**Note:** Initial data may be empty. The system collects DNS data from Cloudflare Gateway over time.

## � Troubleshooting

### "Database not found" error
```bash
# Verify database exists
npx wrangler d1 list

# Re-apply migrations
npx wrangler d1 migrations apply dns-security-db --remote
```

### "KV namespace not found" error
```bash
# Check KV namespaces
npx wrangler kv namespace list

# Verify ID in wrangler.jsonc matches
```

### Frontend shows "API Error"
1. Check backend is deployed: `curl https://your-worker.workers.dev/api/health`
2. Verify API URL in `frontend/src/services/api.ts`
3. Check CORS settings in backend

### No data showing in dashboard
- Data comes from Cloudflare Gateway DNS logs
- Ensure you have Gateway configured with DNS policies
- Data collection happens automatically via cron triggers
- Initial data may take 5-10 minutes to appear

## 🎯 What's Next?

After deployment, you can:

1. **Customize the dashboard** - Modify components in `frontend/src/components/`
2. **Add custom analytics** - Extend `src/services/network-intelligence-analyzer.ts`
3. **Configure alerts** - Set up notifications for high-risk queries
4. **Add custom domains** - Configure via Cloudflare Dashboard
5. **Enable auto-deployment** - Set up GitHub Actions for CI/CD

## 📚 Tech Stack

**Backend:**
- Cloudflare Workers (V8 Isolate)
- Hono v4 (Web Framework)
- D1 (SQLite Database)
- KV (Key-Value Store)
- Analytics Engine

**Frontend:**
- React 18 + TypeScript
- Vite 6 (Build Tool)
- Tailwind CSS v4
- TanStack Query v5
- Recharts (Charts)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**Questions?** Open an issue on GitHub or check [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)


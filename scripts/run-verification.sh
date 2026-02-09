#!/bin/bash

# DNS Security SOC Dashboard - Verification Runner Script
# This script runs all verification tools with the correct environment variables

# Default values
WORKER_URL=${WORKER_URL:-"http://localhost:8787"}
IS_LOCAL=${IS_LOCAL:-"true"}
DB_NAME=${DB_NAME:-"dns-security-db-dev"}
DAYS_TO_ANALYZE=${DAYS_TO_ANALYZE:-"7"}
OUTPUT_DIR=${OUTPUT_DIR:-"./monitoring-reports"}

# Check if we can access the worker
if ! curl -s "$WORKER_URL/api/health" > /dev/null; then
  echo "❌ Error: Cannot connect to worker at $WORKER_URL"
  echo ""
  echo "Please make sure the worker is running and accessible."
  echo "If you're using wrangler secrets, make sure they are set:"
  echo "wrangler secret put CF_API_TOKEN --env development"
  echo "wrangler secret put CF_ACCOUNT_ID --env development"
  exit 1
fi

# Print configuration
echo "=== DNS Security SOC Dashboard - Verification Runner ==="
echo ""
echo "Configuration:"
echo "  Worker URL: $WORKER_URL"
echo "  Database: $DB_NAME"
echo "  Environment: $([ "$IS_LOCAL" = "true" ] && echo "Development" || echo "Production")"
echo "  Days to analyze: $DAYS_TO_ANALYZE"
echo "  Output directory: $OUTPUT_DIR"
echo "  Using Wrangler Secrets for API credentials"
echo ""

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to run a verification tool
run_tool() {
  local tool_name=$1
  local script_path=$2
  
  echo "=== Running $tool_name ==="
  echo ""
  
  # Export environment variables
  export WORKER_URL=$WORKER_URL
  export IS_LOCAL=$IS_LOCAL
  export DB_NAME=$DB_NAME
  export DAYS_TO_ANALYZE=$DAYS_TO_ANALYZE
  export OUTPUT_DIR=$OUTPUT_DIR
  # Note: CF_API_TOKEN and CF_ACCOUNT_ID are now managed by Wrangler Secrets
  
  # Run the tool
  node "$script_path"
  
  # Check exit code
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ $tool_name completed successfully"
  else
    echo ""
    echo "❌ $tool_name failed"
  fi
  
  echo ""
  echo "---------------------------------------------------"
  echo ""
}

# Check if specific tool is requested
if [ "$1" != "" ]; then
  case "$1" in
    dataflow)
      run_tool "Data Flow Verification" "scripts/verify-data-flow.js"
      ;;
    database)
      run_tool "Database Verification" "scripts/verify-database.js"
      ;;
    graphql)
      run_tool "GraphQL Integration Test" "scripts/test-graphql-integration.js"
      ;;
    monitor)
      run_tool "Data Collection Monitoring" "scripts/monitor-data-collection.js"
      ;;
    *)
      echo "Unknown tool: $1"
      echo "Available tools: dataflow, database, graphql, monitor"
      exit 1
      ;;
  esac
  
  exit 0
fi

# Run all verification tools
echo "Running all verification tools..."
echo ""

# Start time
start_time=$(date +%s)

# Run tools
run_tool "Data Flow Verification" "scripts/verify-data-flow.js"
run_tool "Database Verification" "scripts/verify-database.js"
run_tool "GraphQL Integration Test" "scripts/test-graphql-integration.js"
run_tool "Data Collection Monitoring" "scripts/monitor-data-collection.js"

# End time
end_time=$(date +%s)
duration=$((end_time - start_time))

# Print summary
echo "=== Verification Summary ==="
echo ""
echo "All verification tools completed in $duration seconds"
echo "Reports saved to $OUTPUT_DIR"
echo ""
echo "To view detailed results, check the output above or the reports in $OUTPUT_DIR"

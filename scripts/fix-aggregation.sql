-- Fix DNS Security SOC Aggregation Issues
-- Run this to populate missing aggregation data

-- 1. Create composite index for deduplication (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dns_queries_dedup 
ON dns_queries(timestamp, query_name, source_ip);

-- 2. Backfill hourly summaries for last 7 days
INSERT INTO dns_summaries (
  timestamp, 
  period_type, 
  total_queries, 
  blocked_queries,
  allowed_queries, 
  unique_domains, 
  unique_sources,
  top_threats, 
  geographic_distribution
)
SELECT 
  datetime(timestamp, 'start of hour') as hour_timestamp,
  'hourly' as period_type,
  COUNT(*) as total_queries,
  SUM(CASE WHEN blocked = 1 THEN 1 ELSE 0 END) as blocked_queries,
  SUM(CASE WHEN blocked = 0 THEN 1 ELSE 0 END) as allowed_queries,
  COUNT(DISTINCT query_name) as unique_domains,
  COUNT(DISTINCT source_ip) as unique_sources,
  (
    SELECT json_group_array(
      json_object(
        'domain', query_name,
        'category', threat_category,
        'count', cnt
      )
    )
    FROM (
      SELECT query_name, threat_category, COUNT(*) as cnt
      FROM dns_queries q2
      WHERE datetime(q2.timestamp, 'start of hour') = datetime(q1.timestamp, 'start of hour')
        AND q2.blocked = 1
        AND q2.threat_category IS NOT NULL
      GROUP BY query_name, threat_category
      ORDER BY cnt DESC
      LIMIT 10
    )
  ) as top_threats,
  (
    SELECT json_group_array(
      json_object(
        'location', source_ip,
        'count', cnt
      )
    )
    FROM (
      SELECT source_ip, COUNT(*) as cnt
      FROM dns_queries q3
      WHERE datetime(q3.timestamp, 'start of hour') = datetime(q1.timestamp, 'start of hour')
      GROUP BY source_ip
      ORDER BY cnt DESC
      LIMIT 20
    )
  ) as geographic_distribution
FROM dns_queries q1
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY datetime(timestamp, 'start of hour')
HAVING NOT EXISTS (
  SELECT 1 FROM dns_summaries s
  WHERE s.timestamp = datetime(q1.timestamp, 'start of hour')
    AND s.period_type = 'hourly'
);

-- 3. Populate threat intelligence from existing data
INSERT OR REPLACE INTO threat_intelligence (
  domain,
  category,
  risk_score,
  first_seen,
  last_seen,
  total_queries,
  blocked_count,
  source_ips
)
SELECT 
  query_name as domain,
  COALESCE(threat_category, 'Unknown') as category,
  MAX(risk_score) as risk_score,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen,
  SUM(count) as total_queries,
  SUM(CASE WHEN blocked = 1 THEN count ELSE 0 END) as blocked_count,
  json_group_array(DISTINCT source_ip) as source_ips
FROM dns_queries
WHERE blocked = 1
  AND timestamp >= datetime('now', '-30 days')
GROUP BY query_name, COALESCE(threat_category, 'Unknown')
HAVING blocked_count > 0;

-- 4. Populate geographic analytics
INSERT OR REPLACE INTO geographic_analytics (
  timestamp,
  country,
  queries,
  threats,
  blocked,
  period_type
)
SELECT 
  datetime(timestamp, 'start of hour') as hour_timestamp,
  source_ip as country,
  SUM(count) as queries,
  SUM(CASE WHEN threat_category IS NOT NULL THEN count ELSE 0 END) as threats,
  SUM(CASE WHEN blocked = 1 THEN count ELSE 0 END) as blocked,
  'hourly' as period_type
FROM dns_queries
WHERE timestamp >= datetime('now', '-30 days')
GROUP BY datetime(timestamp, 'start of hour'), source_ip;

-- 5. Verify results
SELECT 
  'dns_summaries' as table_name,
  COUNT(*) as row_count,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM dns_summaries
UNION ALL
SELECT 
  'threat_intelligence',
  COUNT(*),
  MIN(first_seen),
  MAX(last_seen)
FROM threat_intelligence
UNION ALL
SELECT 
  'geographic_analytics',
  COUNT(*),
  MIN(timestamp),
  MAX(timestamp)
FROM geographic_analytics;

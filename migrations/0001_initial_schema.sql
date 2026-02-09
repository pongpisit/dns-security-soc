-- DNS Security SOC Database Schema
-- Optimized for 90+ days of data retention with fast querying

-- DNS Queries table - stores individual DNS query records
CREATE TABLE dns_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    query_name TEXT NOT NULL,
    query_type TEXT NOT NULL,
    resolver_decision TEXT NOT NULL,
    source_ip TEXT NOT NULL,
    user_email TEXT,
    device_name TEXT,
    location TEXT,
    count INTEGER DEFAULT 1,
    threat_category TEXT,
    risk_score INTEGER DEFAULT 0,
    blocked BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast querying
CREATE INDEX idx_dns_queries_timestamp ON dns_queries(timestamp);
CREATE INDEX idx_dns_queries_query_name ON dns_queries(query_name);
CREATE INDEX idx_dns_queries_source_ip ON dns_queries(source_ip);
CREATE INDEX idx_dns_queries_blocked ON dns_queries(blocked);
CREATE INDEX idx_dns_queries_threat_category ON dns_queries(threat_category);
CREATE INDEX idx_dns_queries_user_email ON dns_queries(user_email);

-- DNS Summaries table - pre-aggregated data for fast dashboard loading
CREATE TABLE dns_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    period_type TEXT NOT NULL, -- 'hourly', 'daily', 'weekly'
    total_queries INTEGER NOT NULL,
    blocked_queries INTEGER NOT NULL,
    allowed_queries INTEGER NOT NULL,
    unique_domains INTEGER NOT NULL,
    unique_sources INTEGER NOT NULL,
    top_threats TEXT, -- JSON array of top threats
    geographic_distribution TEXT, -- JSON object of location data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dns_summaries_timestamp ON dns_summaries(timestamp);
CREATE INDEX idx_dns_summaries_period_type ON dns_summaries(period_type);

-- Threat Intelligence table - stores threat data for domains
CREATE TABLE threat_intelligence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    first_seen DATETIME NOT NULL,
    last_seen DATETIME NOT NULL,
    total_queries INTEGER DEFAULT 0,
    blocked_count INTEGER DEFAULT 0,
    source_ips TEXT, -- JSON array of source IPs
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threat_intelligence_domain ON threat_intelligence(domain);
CREATE INDEX idx_threat_intelligence_category ON threat_intelligence(category);
CREATE INDEX idx_threat_intelligence_risk_score ON threat_intelligence(risk_score);

-- Cron Job Logs table - tracks automated data collection
CREATE TABLE cron_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_type TEXT NOT NULL,
    execution_time DATETIME NOT NULL,
    records_processed INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error TEXT,
    duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cron_logs_job_type ON cron_logs(job_type);
CREATE INDEX idx_cron_logs_execution_time ON cron_logs(execution_time);

-- Geographic Analytics table - stores location-based metrics
CREATE TABLE geographic_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    city TEXT,
    queries INTEGER DEFAULT 0,
    threats INTEGER DEFAULT 0,
    blocked INTEGER DEFAULT 0,
    period_type TEXT NOT NULL, -- 'hourly', 'daily'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_geographic_analytics_timestamp ON geographic_analytics(timestamp);
CREATE INDEX idx_geographic_analytics_country ON geographic_analytics(country);

-- Device Analytics table - stores device-based metrics
CREATE TABLE device_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    device_name TEXT NOT NULL,
    user_email TEXT,
    queries INTEGER DEFAULT 0,
    threats INTEGER DEFAULT 0,
    blocked INTEGER DEFAULT 0,
    period_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_analytics_timestamp ON device_analytics(timestamp);
CREATE INDEX idx_device_analytics_device_name ON device_analytics(device_name);
CREATE INDEX idx_device_analytics_user_email ON device_analytics(user_email);

-- Security Events table - stores significant security events
CREATE TABLE security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    event_type TEXT NOT NULL, -- 'threat_detected', 'anomaly', 'policy_violation'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    domain TEXT,
    source_ip TEXT,
    user_email TEXT,
    device_name TEXT,
    description TEXT,
    metadata TEXT, -- JSON object with additional data
    resolved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

-- Performance Metrics table - tracks API and system performance
CREATE TABLE performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    metric_type TEXT NOT NULL, -- 'api_response_time', 'query_processing_time', 'data_collection_time'
    value REAL NOT NULL,
    metadata TEXT, -- JSON object with additional context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_metric_type ON performance_metrics(metric_type);

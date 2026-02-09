/**
 * Network Intelligence Analyzer
 * Processes DNS data for resolution chains, authoritative nameservers, and error analysis
 */

// Individual DNS query type (from ProcessedDNSData.queries array)
interface DNSQuery {
  timestamp: string;
  query_name: string;
  query_type: string;
  resolver_decision: string;
  source_ip: string;
  location?: string;
  count: number;
  threat_category?: string;
  risk_score: number;
  blocked: boolean;
  application_name?: string;
  cnames?: string[];
  resolved_ips?: string[];
  resolved_ip_countries?: string[];
  authoritative_nameserver_ips?: string[];
  cache_status?: string;
  ede_errors?: string[];
  internal_dns_rcode?: string;
  custom_resolver_response_code?: string;
}

export interface ResolutionStep {
  step: number;
  record_type: string;
  query: string;
  response: string[];
  response_time: number;
  authoritative_server: string;
  is_cached: boolean;
  ttl: number;
}

export interface ResolutionChainData {
  domain: string;
  final_ips: string[];
  total_steps: number;
  total_time: number;
  chain: ResolutionStep[];
  security_status: 'safe' | 'suspicious' | 'blocked';
  timestamp: string;
  query_count: number;
}

export interface NSData {
  nameserver_ip: string;
  query_count: number;
  countries: string[];
  avg_response_time: number;
  reliability_score: number;
  domains_served: number;
}

export interface ErrorData {
  error_type: string;
  error_code: string;
  count: number;
  percentage: number;
  description: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  examples: string[];
}

export class NetworkIntelligenceAnalyzer {
  /**
   * Analyze CNAME resolution chains from DNS data
   */
  analyzeResolutionChains(data: DNSQuery[]): ResolutionChainData[] {
    const chainMap = new Map<string, ResolutionChainData>();

    data.forEach(query => {
      const domain = query.query_name;
      const cnames = query.cnames || [];
      const resolvedIps = query.resolved_ips || [];
      
      // Skip if no CNAME chain
      if (cnames.length === 0) {
        return;
      }

      const chainKey = `${domain}-${cnames.join('-')}`;
      
      if (chainMap.has(chainKey)) {
        const existing = chainMap.get(chainKey)!;
        existing.query_count += query.count;
        return;
      }

      // Build resolution chain
      const chain: ResolutionStep[] = [];
      
      // Step 1: Original query
      chain.push({
        step: 1,
        record_type: 'QUERY',
        query: domain,
        response: cnames.length > 0 ? [cnames[0]] : resolvedIps,
        response_time: 10, // Estimated
        authoritative_server: query.authoritative_nameserver_ips?.[0] || 'unknown',
        is_cached: query.cache_status === 'hit',
        ttl: 300
      });

      // Step 2+: CNAME chain
      cnames.forEach((cname, index) => {
        chain.push({
          step: index + 2,
          record_type: 'CNAME',
          query: cname,
          response: index < cnames.length - 1 ? [cnames[index + 1]] : resolvedIps,
          response_time: 5,
          authoritative_server: query.authoritative_nameserver_ips?.[index] || 'unknown',
          is_cached: query.cache_status === 'hit',
          ttl: 300
        });
      });

      // Final step: A/AAAA record
      if (resolvedIps.length > 0) {
        chain.push({
          step: chain.length + 1,
          record_type: resolvedIps[0].includes(':') ? 'AAAA' : 'A',
          query: cnames[cnames.length - 1] || domain,
          response: resolvedIps,
          response_time: 5,
          authoritative_server: query.authoritative_nameserver_ips?.[cnames.length] || 'unknown',
          is_cached: query.cache_status === 'hit',
          ttl: 300
        });
      }

      // Determine security status
      let securityStatus: 'safe' | 'suspicious' | 'blocked' = 'safe';
      if (query.blocked) {
        securityStatus = 'blocked';
      } else if (chain.length > 5 || cnames.some(c => c.includes('suspicious'))) {
        securityStatus = 'suspicious';
      }

      chainMap.set(chainKey, {
        domain,
        final_ips: resolvedIps,
        total_steps: chain.length,
        total_time: chain.reduce((sum, step) => sum + step.response_time, 0),
        chain,
        security_status: securityStatus,
        timestamp: query.timestamp,
        query_count: query.count
      });
    });

    // Return top 20 most complex or most queried chains
    return Array.from(chainMap.values())
      .sort((a, b) => {
        // Prioritize blocked/suspicious chains
        if (a.security_status !== 'safe' && b.security_status === 'safe') return -1;
        if (a.security_status === 'safe' && b.security_status !== 'safe') return 1;
        // Then by complexity
        if (a.total_steps !== b.total_steps) return b.total_steps - a.total_steps;
        // Then by query count
        return b.query_count - a.query_count;
      })
      .slice(0, 20);
  }

  /**
   * Analyze authoritative nameservers
   */
  analyzeAuthoritativeNameservers(data: DNSQuery[]): NSData[] {
    const nsMap = new Map<string, {
      count: number;
      countries: Set<string>;
      domains: Set<string>;
      totalResponseTime: number;
      queries: number;
    }>();

    data.forEach(query => {
      const nsIps = query.authoritative_nameserver_ips || [];
      
      nsIps.forEach(nsIp => {
        if (!nsIp || nsIp === 'unknown') return;

        if (!nsMap.has(nsIp)) {
          nsMap.set(nsIp, {
            count: 0,
            countries: new Set(),
            domains: new Set(),
            totalResponseTime: 0,
            queries: 0
          });
        }

        const ns = nsMap.get(nsIp)!;
        ns.count += query.count;
        ns.queries += 1;
        ns.domains.add(query.query_name);
        
        // Add countries from resolved IPs
        if (query.resolved_ip_countries) {
          query.resolved_ip_countries.forEach(country => ns.countries.add(country));
        }
        
        // Estimate response time based on cache status
        ns.totalResponseTime += query.cache_status === 'hit' ? 5 : 50;
      });
    });

    // Convert to array and calculate metrics
    return Array.from(nsMap.entries())
      .map(([nsIp, data]) => ({
        nameserver_ip: nsIp,
        query_count: data.count,
        countries: Array.from(data.countries),
        avg_response_time: data.queries > 0 ? Math.round(data.totalResponseTime / data.queries) : 0,
        reliability_score: Math.min(100, Math.round((data.count / Math.max(...Array.from(nsMap.values()).map(v => v.count))) * 100)),
        domains_served: data.domains.size
      }))
      .sort((a, b) => b.query_count - a.query_count)
      .slice(0, 20);
  }

  /**
   * Analyze DNS errors
   */
  analyzeDnsErrors(data: DNSQuery[]): ErrorData[] {
    const errorMap = new Map<string, {
      count: number;
      examples: Set<string>;
    }>();

    let totalQueries = 0;

    data.forEach(query => {
      totalQueries += query.count;

      // Parse EDE errors
      const edeErrors = query.ede_errors || [];
      edeErrors.forEach(error => {
        const key = `EDE-${error}`;
        if (!errorMap.has(key)) {
          errorMap.set(key, { count: 0, examples: new Set() });
        }
        const errorData = errorMap.get(key)!;
        errorData.count += query.count;
        errorData.examples.add(query.query_name);
      });

      // Parse internal DNS response codes
      if (query.internal_dns_rcode && query.internal_dns_rcode !== 'NOERROR') {
        const key = `RCODE-${query.internal_dns_rcode}`;
        if (!errorMap.has(key)) {
          errorMap.set(key, { count: 0, examples: new Set() });
        }
        const errorData = errorMap.get(key)!;
        errorData.count += query.count;
        errorData.examples.add(query.query_name);
      }

      // Parse custom resolver response codes
      if (query.custom_resolver_response_code && query.custom_resolver_response_code !== '0') {
        const key = `RESOLVER-${query.custom_resolver_response_code}`;
        if (!errorMap.has(key)) {
          errorMap.set(key, { count: 0, examples: new Set() });
        }
        const errorData = errorMap.get(key)!;
        errorData.count += query.count;
        errorData.examples.add(query.query_name);
      }
    });

    // Convert to array with descriptions
    return Array.from(errorMap.entries())
      .map(([errorCode, data]) => {
        const [type, code] = errorCode.split('-');
        return {
          error_type: type,
          error_code: code,
          count: data.count,
          percentage: totalQueries > 0 ? parseFloat(((data.count / totalQueries) * 100).toFixed(2)) : 0,
          description: this.getErrorDescription(type, code),
          trend: 'stable' as const, // Would need historical data for real trend
          examples: Array.from(data.examples).slice(0, 5)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  /**
   * Get human-readable error descriptions
   */
  private getErrorDescription(type: string, code: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      'EDE': {
        '0': 'Other Error',
        '1': 'Unsupported DNSKEY Algorithm',
        '2': 'Unsupported DS Digest Type',
        '3': 'Stale Answer',
        '4': 'Forged Answer',
        '5': 'DNSSEC Indeterminate',
        '6': 'DNSSEC Bogus',
        '7': 'Signature Expired',
        '8': 'Signature Not Yet Valid',
        '9': 'DNSKEY Missing',
        '10': 'RRSIGs Missing',
        '11': 'No Zone Key Bit Set',
        '12': 'NSEC Missing',
        '15': 'Blocked',
        '16': 'Censored',
        '17': 'Filtered',
        '18': 'Prohibited',
        '19': 'Stale NXDomain Answer',
        '20': 'Not Authoritative',
        '21': 'Not Supported',
        '22': 'No Reachable Authority',
        '23': 'Network Error',
        '24': 'Invalid Data'
      },
      'RCODE': {
        'NOERROR': 'No Error',
        'FORMERR': 'Format Error',
        'SERVFAIL': 'Server Failure',
        'NXDOMAIN': 'Non-Existent Domain',
        'NOTIMP': 'Not Implemented',
        'REFUSED': 'Query Refused',
        'YXDOMAIN': 'Name Exists',
        'YXRRSET': 'RR Set Exists',
        'NXRRSET': 'RR Set Does Not Exist',
        'NOTAUTH': 'Not Authorized',
        'NOTZONE': 'Name Not In Zone'
      },
      'RESOLVER': {
        '0': 'Success',
        '1': 'Resolver Error',
        '2': 'Timeout',
        '3': 'Network Unreachable',
        '4': 'Connection Refused',
        '5': 'Invalid Response'
      }
    };

    return descriptions[type]?.[code] || `${type} Error ${code}`;
  }
}

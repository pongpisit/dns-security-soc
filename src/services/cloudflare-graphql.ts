import { CloudflareGraphQLResponse, GraphQLQueryVariables, Env } from '../types';

/**
 * Service for interacting with Cloudflare GraphQL API
 * Focuses on DNS security telemetry for SOC and NOC monitoring
 */
export class CloudflareGraphQLService {
  private readonly apiUrl = 'https://api.cloudflare.com/client/v4/graphql';
  private readonly apiToken: string;
  private readonly accountId: string;
  
  constructor(private env: Env) {
    // Get API token and account ID from environment secrets
    this.apiToken = env.CF_API_TOKEN;
    this.accountId = env.CF_ACCOUNT_ID;
  }

  /**
   * Execute GraphQL query against Cloudflare Analytics API
   * Includes retry logic with exponential backoff
   */
  private async executeQuery(query: string, variables: any): Promise<CloudflareGraphQLResponse> {
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    while (true) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables,
          }),
        });

        const responseTime = Date.now() - startTime;
        
        // Log performance metric
        if (this.env.ENVIRONMENT === 'development') {
          console.log(`GraphQL query executed in ${responseTime}ms`);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as CloudflareGraphQLResponse;
        
        if (data.errors && data.errors.length > 0) {
          throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
        }

        // Store performance metric in DB if in production
        if (this.env.ENVIRONMENT === 'production') {
          try {
            await this.env.DB.prepare(`
              INSERT INTO performance_metrics (timestamp, metric_type, value, metadata)
              VALUES (?, ?, ?, ?)
            `).bind(
              new Date().toISOString(),
              'graphql_query_time',
              responseTime,
              JSON.stringify({ query_type: 'dns_security', variables })
            ).run();
          } catch (error) {
            console.error('Failed to log performance metric:', error);
          }
        }

        return data;
      } catch (error) {
        retries++;
        
        // Log the error
        console.error(`GraphQL query failed (attempt ${retries}/${maxRetries}):`, error);
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, retries - 1) * (0.5 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Get DNS security telemetry optimized for SOC/NOC monitoring
   * Includes critical security and network dimensions
   */
  async getDnsSecurityTelemetry(
    startTime: string, 
    endTime: string, 
    limit = 10000,
    filter?: Record<string, any>
  ): Promise<CloudflareGraphQLResponse> {
    const query = `
      query GetDnsSecurityTelemetry(
        $accountTag: string!, 
        $startTime: string!, 
        $endTime: string!, 
        $limit: int!
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            gatewayResolverQueriesAdaptiveGroups(
              filter: {
                datetime_geq: $startTime
                datetime_leq: $endTime
                ${filter ? Object.entries(filter).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n') : ''}
              }
              limit: $limit
              orderBy: [datetime_DESC]
            ) {
              count
              dimensions {
                # Basic query information (6 fields)
                queryName
                queryNameReversed
                datetime
                datetimeHour
                datetimeMinute
                resolverDecision
                
                # Security dimensions (12 fields) - Enhanced with IDs
                categoryNames
                categoryIds
                policyName
                policyId
                matchedApplicationName
                matchedApplicationId
                matchedIndicatorFeedNames
                matchedIndicatorFeedIds
                scheduleInfo
                
                # Network dimensions (12 fields) - Enhanced with NS and errors
                resolvedIps
                resolvedIpCountries
                resolvedIpContinents
                cnames
                authoritativeNameserverIps
                resourceRecordTypes
                resourceRecordClasses
                customResolverCacheStatus
                customResolverAddress
                customResolverResponseCode
                internalDnsRCode
                edeErrors
                
                # Geographic dimensions (4 fields) - Enhanced with IDs
                srcIpCountry
                srcIpContinent
                locationName
                locationId
                
                # Protocol & Performance dimensions (3 fields)
                dohSubdomain
                dotSubdomain
              }
            }
          }
        }
      }
    `;

    const variables = {
      accountTag: this.accountId,
      startTime,
      endTime,
      limit,
    };

    return this.executeQuery(query, variables);
  }

  /**
   * Get DNS security metrics aggregated by category
   * Useful for security categorization and threat analysis
   */
  async getDnsCategoryMetrics(
    startTime: string, 
    endTime: string, 
    limit = 1000
  ): Promise<CloudflareGraphQLResponse> {
    const query = `
      query GetDnsCategoryMetrics(
        $accountTag: string!, 
        $startTime: string!, 
        $endTime: string!, 
        $limit: int!
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            gatewayResolverQueriesAdaptiveGroups(
              filter: {
                datetime_geq: $startTime
                datetime_leq: $endTime
              }
              limit: $limit
              orderBy: [count_DESC]
            ) {
              count
              dimensions {
                categoryNames
                resolverDecision
                matchedIndicatorFeedNames
              }
            }
          }
        }
      }
    `;

    const variables = {
      accountTag: this.accountId,
      startTime,
      endTime,
      limit,
    };

    return this.executeQuery(query, variables);
  }

  /**
   * Get DNS security metrics aggregated by geographic location
   * Useful for identifying geographic patterns and anomalies
   */
  async getDnsGeoMetrics(
    startTime: string, 
    endTime: string, 
    limit = 1000
  ): Promise<CloudflareGraphQLResponse> {
    const query = `
      query GetDnsGeoMetrics(
        $accountTag: string!, 
        $startTime: string!, 
        $endTime: string!, 
        $limit: int!
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            gatewayResolverQueriesAdaptiveGroups(
              filter: {
                datetime_geq: $startTime
                datetime_leq: $endTime
              }
              limit: $limit
              orderBy: [count_DESC]
            ) {
              count
              dimensions {
                srcIpCountry
                resolverDecision
                locationName
                categoryNames
              }
            }
          }
        }
      }
    `;

    const variables = {
      accountTag: this.accountId,
      startTime,
      endTime,
      limit,
    };

    return this.executeQuery(query, variables);
  }

  /**
   * Get DNS security metrics for top domains
   * Useful for identifying suspicious domains and traffic patterns
   */
  async getTopDomains(
    startTime: string, 
    endTime: string, 
    limit = 100
  ): Promise<CloudflareGraphQLResponse> {
    const query = `
      query GetTopDomains(
        $accountTag: string!, 
        $startTime: string!, 
        $endTime: string!, 
        $limit: int!
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            gatewayResolverQueriesAdaptiveGroups(
              filter: {
                datetime_geq: $startTime
                datetime_leq: $endTime
              }
              limit: $limit
              orderBy: [count_DESC]
            ) {
              count
              dimensions {
                queryName
                categoryNames
                matchedApplicationName
                resolverDecision
                resolvedIps
                resolvedIpCountries
              }
            }
          }
        }
      }
    `;

    const variables = {
      accountTag: this.accountId,
      startTime,
      endTime,
      limit,
    };

    return this.executeQuery(query, variables);
  }

  /**
   * Get DNS security metrics for blocked queries
   * Critical for security monitoring and threat detection
   */
  async getBlockedQueries(
    startTime: string, 
    endTime: string, 
    limit = 1000
  ): Promise<CloudflareGraphQLResponse> {
    const query = `
      query GetBlockedQueries(
        $accountTag: string!, 
        $startTime: string!, 
        $endTime: string!, 
        $limit: int!
      ) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            gatewayResolverQueriesAdaptiveGroups(
              filter: {
                datetime_geq: $startTime
                datetime_leq: $endTime
                resolverDecision_in: ["2", "3", "6", "9"] # Blocked decisions
              }
              limit: $limit
              orderBy: [datetime_DESC]
            ) {
              count
              dimensions {
                queryName
                datetime
                categoryNames
                policyName
                matchedApplicationName
                matchedIndicatorFeedNames
                resolverDecision
                srcIpCountry
                locationName
              }
            }
          }
        }
      }
    `;

    const variables = {
      accountTag: this.accountId,
      startTime,
      endTime,
      limit,
    };

    return this.executeQuery(query, variables);
  }

  /**
   * Test the GraphQL service in development environment
   * Validates connectivity and data retrieval
   */
  async testGraphQLService(): Promise<boolean> {
    if (this.env.ENVIRONMENT !== 'development') {
      console.log('Test only available in development environment');
      return true;
    }

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const result = await this.getDnsSecurityTelemetry(
        oneHourAgo.toISOString(),
        now.toISOString(),
        10
      );
      
      const queries = result.data?.viewer?.accounts[0]?.gatewayResolverQueriesAdaptiveGroups || [];
      console.log(`✅ GraphQL test successful: Retrieved ${queries.length} DNS queries`);
      
      return queries.length > 0;
    } catch (error) {
      console.error('❌ GraphQL test failed:', error);
      return false;
    }
  }
}

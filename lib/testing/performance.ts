/**
 * Performance Testing and Monitoring Framework
 * Load testing, stress testing, and performance regression detection
 */

import { PerformanceBenchmark, PerformanceMetric } from '../../types/testing';
import { performanceBenchmarkManager } from './core';

/**
 * Performance test configuration
 */
interface PerformanceTestConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  concurrency: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
}

/**
 * Load test result
 */
interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTimes: number[];
  errors: string[];
}

/**
 * Performance tester for API endpoints
 */
export class PerformanceTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Run load test on an endpoint
   */
  async runLoadTest(config: PerformanceTestConfig): Promise<LoadTestResult> {
    const results: LoadTestResult = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 0,
      responseTimes: [],
      errors: [],
    };

    const startTime = Date.now();
    const endTime = startTime + config.duration * 1000;
    const requests: Promise<void>[] = [];

    // Ramp up requests gradually
    const rampUpInterval = (config.rampUpTime * 1000) / config.concurrency;

    for (let i = 0; i < config.concurrency; i++) {
      // Delay each concurrent request during ramp-up
      const delay = i * rampUpInterval;
      
      const requestPromise = new Promise<void>((resolve) => {
        setTimeout(async () => {
          while (Date.now() < endTime) {
            await this.executeRequest(config, results);
            // Small delay between requests from the same "user"
            await this.sleep(100);
          }
          resolve();
        }, delay);
      });

      requests.push(requestPromise);
    }

    // Wait for all concurrent requests to complete
    await Promise.all(requests);

    // Calculate final metrics
    const totalTime = (Date.now() - startTime) / 1000;
    results.requestsPerSecond = results.totalRequests / totalTime;
    results.errorRate = (results.failedRequests / results.totalRequests) * 100;
    results.averageResponseTime = results.responseTimes.length > 0
      ? results.responseTimes.reduce((sum, time) => sum + time, 0) / results.responseTimes.length
      : 0;
    results.minResponseTime = results.responseTimes.length > 0
      ? Math.min(...results.responseTimes)
      : 0;
    results.maxResponseTime = Math.max(...results.responseTimes);

    return results;
  }

  /**
   * Execute a single request and record metrics
   */
  private async executeRequest(
    config: PerformanceTestConfig,
    results: LoadTestResult
  ): Promise<void> {
    const requestStartTime = Date.now();
    
    try {
      const url = `${this.baseUrl}${config.endpoint}`;
      const response = await fetch(url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      const responseTime = Date.now() - requestStartTime;
      results.responseTimes.push(responseTime);
      results.totalRequests++;

      if (response.ok) {
        results.successfulRequests++;
      } else {
        results.failedRequests++;
        results.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const responseTime = Date.now() - requestStartTime;
      results.responseTimes.push(responseTime);
      results.totalRequests++;
      results.failedRequests++;
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run stress test to find breaking points
   */
  async runStressTest(
    config: Omit<PerformanceTestConfig, 'concurrency'>,
    maxConcurrency: number = 100,
    step: number = 10
  ): Promise<{ breakingPoint: number; results: LoadTestResult[] }> {
    const results: LoadTestResult[] = [];
    let breakingPoint = maxConcurrency;

    for (let concurrency = step; concurrency <= maxConcurrency; concurrency += step) {
      const testConfig: PerformanceTestConfig = {
        ...config,
        concurrency,
      };

      console.log(`Running stress test with ${concurrency} concurrent users...`);
      const result = await this.runLoadTest(testConfig);
      results.push(result);

      // Check if we've reached a breaking point (high error rate or response times)
      if (result.errorRate > 5 || result.averageResponseTime > 10000) {
        breakingPoint = concurrency;
        break;
      }
    }

    return { breakingPoint, results };
  }

  /**
   * Monitor memory usage during test
   */
  monitorMemoryUsage(): NodeJS.Timer {
    const interval = setInterval(() => {
      const memUsage = process.memoryUsage();
      console.log(`Memory Usage: RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }, 5000);

    return interval;
  }

  /**
   * Create performance benchmark from test results
   */
  createBenchmark(
    id: string,
    endpoint: string,
    result: LoadTestResult,
    thresholds: {
      maxResponseTime: number;
      minThroughput: number;
      maxErrorRate: number;
    }
  ): PerformanceBenchmark {
    const metrics: PerformanceMetric = {
      responseTime: result.averageResponseTime,
      throughput: result.requestsPerSecond,
      errorRate: result.errorRate,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // Would need additional monitoring for accurate CPU usage
      timestamp: new Date(),
    };

    const benchmark: PerformanceBenchmark = {
      id,
      endpoint,
      metrics,
      thresholds,
      baseline: metrics, // First run establishes baseline
      trend: 'stable',
    };

    performanceBenchmarkManager.registerBenchmark(benchmark);
    return benchmark;
  }
}

/**
 * FAQ-specific performance tests
 */
export class FAQPerformanceTester extends PerformanceTester {
  /**
   * Test FAQ endpoint performance
   */
  async testFAQPerformance(
    eventId: string,
    userEmail: string,
    question: string = 'What time does the event start?'
  ): Promise<LoadTestResult> {
    const config: PerformanceTestConfig = {
      endpoint: '/api/faq',
      method: 'POST',
      headers: {
        'x-test-user': userEmail,
        'Content-Type': 'application/json',
      },
      body: {
        question,
        eventId,
      },
      concurrency: 5,
      duration: 30, // 30 seconds
      rampUpTime: 5, // 5 seconds ramp-up
    };

    return this.runLoadTest(config);
  }

  /**
   * Test file upload performance
   */
  async testUploadPerformance(
    eventId: string,
    userEmail: string
  ): Promise<LoadTestResult> {
    const config: PerformanceTestConfig = {
      endpoint: '/api/upload',
      method: 'POST',
      headers: {
        'x-test-user': userEmail,
      },
      concurrency: 3, // Lower concurrency for upload tests
      duration: 60, // 1 minute
      rampUpTime: 10, // 10 seconds ramp-up
    };

    return this.runLoadTest(config);
  }

  /**
   * Test chat history performance
   */
  async testChatHistoryPerformance(
    eventId: string,
    userEmail: string
  ): Promise<LoadTestResult> {
    const config: PerformanceTestConfig = {
      endpoint: `/api/chat-history?eventId=${eventId}`,
      method: 'GET',
      headers: {
        'x-test-user': userEmail,
      },
      concurrency: 10,
      duration: 30,
      rampUpTime: 5,
    };

    return this.runLoadTest(config);
  }

  /**
   * Run comprehensive FAQ performance test suite
   */
  async runComprehensivePerformanceTests(
    eventId: string,
    userEmail: string
  ): Promise<{
    faqTest: LoadTestResult;
    uploadTest: LoadTestResult;
    chatHistoryTest: LoadTestResult;
    benchmarks: PerformanceBenchmark[];
  }> {
    console.log('Running comprehensive FAQ performance tests...');

    const [faqTest, uploadTest, chatHistoryTest] = await Promise.all([
      this.testFAQPerformance(eventId, userEmail),
      this.testUploadPerformance(eventId, userEmail),
      this.testChatHistoryPerformance(eventId, userEmail),
    ]);

    // Create benchmarks
    const benchmarks = [
      this.createBenchmark('faq-endpoint', '/api/faq', faqTest, {
        maxResponseTime: 5000,
        minThroughput: 1,
        maxErrorRate: 5,
      }),
      this.createBenchmark('upload-endpoint', '/api/upload', uploadTest, {
        maxResponseTime: 30000,
        minThroughput: 0.5,
        maxErrorRate: 5,
      }),
      this.createBenchmark('chat-history-endpoint', '/api/chat-history', chatHistoryTest, {
        maxResponseTime: 2000,
        minThroughput: 5,
        maxErrorRate: 2,
      }),
    ];

    return {
      faqTest,
      uploadTest,
      chatHistoryTest,
      benchmarks,
    };
  }
}

/**
 * Database performance monitor
 */
export class DatabasePerformanceMonitor {
  /**
   * Monitor query performance
   */
  static async measureQueryTime<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    console.log(`Query ${queryName} took ${duration}ms`);
    
    return { result, duration };
  }

  /**
   * Check for slow queries
   */
  static logSlowQuery(queryName: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms (threshold: ${threshold}ms)`);
    }
  }
}

// Export default instance
export const performanceTester = new PerformanceTester();
export const faqPerformanceTester = new FAQPerformanceTester();
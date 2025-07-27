/**
 * Core testing utilities and infrastructure
 */

import { TestSuite, TestResult, QualityMetric, PerformanceBenchmark } from '../../types/testing';

/**
 * Test suite manager for organizing and running different types of tests
 */
export class TestSuiteManager {
  private suites: Map<string, TestSuite> = new Map();
  private results: TestResult[] = [];

  /**
   * Register a test suite
   */
  registerSuite(suite: TestSuite): void {
    this.suites.set(suite.id, suite);
  }

  /**
   * Get all registered test suites
   */
  getSuites(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  /**
   * Get test suite by ID
   */
  getSuite(id: string): TestSuite | undefined {
    return this.suites.get(id);
  }

  /**
   * Record test result
   */
  recordResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Get test results for a specific suite
   */
  getResults(suiteId?: string): TestResult[] {
    if (suiteId) {
      return this.results.filter(result => result.suiteId === suiteId);
    }
    return this.results;
  }

  /**
   * Calculate overall test coverage
   */
  calculateCoverage(): { lines: number; functions: number; branches: number; statements: number } {
    const suites = this.getSuites();
    if (suites.length === 0) {
      return { lines: 0, functions: 0, branches: 0, statements: 0 };
    }

    const totals = suites.reduce((acc, suite) => ({
      lines: acc.lines + suite.coverage.lines,
      functions: acc.functions + suite.coverage.functions,
      branches: acc.branches + suite.coverage.branches,
      statements: acc.statements + suite.coverage.statements,
    }), { lines: 0, functions: 0, branches: 0, statements: 0 });

    return {
      lines: totals.lines / suites.length,
      functions: totals.functions / suites.length,
      branches: totals.branches / suites.length,
      statements: totals.statements / suites.length,
    };
  }
}

/**
 * Quality metrics collector and analyzer
 */
export class QualityMetricsCollector {
  private metrics: QualityMetric[] = [];

  /**
   * Record a quality metric
   */
  recordMetric(metric: QualityMetric): void {
    this.metrics.push(metric);
  }

  /**
   * Get metrics by feature
   */
  getMetricsByFeature(feature: string): QualityMetric[] {
    return this.metrics.filter(metric => metric.feature === feature);
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(metricType: QualityMetric['metric']): QualityMetric[] {
    return this.metrics.filter(metric => metric.metric === metricType);
  }

  /**
   * Check if quality thresholds are met
   */
  checkQualityThresholds(): boolean {
    return this.metrics.every(metric => metric.passed);
  }

  /**
   * Get quality summary
   */
  getQualitySummary(): {
    totalMetrics: number;
    passedMetrics: number;
    failedMetrics: number;
    averageScore: number;
  } {
    const totalMetrics = this.metrics.length;
    const passedMetrics = this.metrics.filter(m => m.passed).length;
    const failedMetrics = totalMetrics - passedMetrics;
    const averageScore = totalMetrics > 0 
      ? this.metrics.reduce((sum, m) => sum + m.value, 0) / totalMetrics 
      : 0;

    return {
      totalMetrics,
      passedMetrics,
      failedMetrics,
      averageScore,
    };
  }
}

/**
 * Performance benchmark manager
 */
export class PerformanceBenchmarkManager {
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();

  /**
   * Register a performance benchmark
   */
  registerBenchmark(benchmark: PerformanceBenchmark): void {
    this.benchmarks.set(benchmark.id, benchmark);
  }

  /**
   * Get all benchmarks
   */
  getBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  /**
   * Get benchmark by ID
   */
  getBenchmark(id: string): PerformanceBenchmark | undefined {
    return this.benchmarks.get(id);
  }

  /**
   * Check for performance regressions
   */
  checkRegressions(): { hasRegressions: boolean; regressions: string[] } {
    const regressions: string[] = [];

    this.benchmarks.forEach((benchmark, id) => {
      const { metrics, thresholds } = benchmark;
      
      if (metrics.responseTime > thresholds.maxResponseTime) {
        regressions.push(`${id}: Response time exceeded threshold (${metrics.responseTime}ms > ${thresholds.maxResponseTime}ms)`);
      }
      
      if (metrics.throughput < thresholds.minThroughput) {
        regressions.push(`${id}: Throughput below threshold (${metrics.throughput} < ${thresholds.minThroughput})`);
      }
      
      if (metrics.errorRate > thresholds.maxErrorRate) {
        regressions.push(`${id}: Error rate exceeded threshold (${metrics.errorRate}% > ${thresholds.maxErrorRate}%)`);
      }
    });

    return {
      hasRegressions: regressions.length > 0,
      regressions,
    };
  }
}

/**
 * Test environment utilities
 */
export class TestEnvironment {
  /**
   * Set up test environment variables
   */
  static setupTestEnv(): void {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/primr-faq-test';
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.AWS_BUCKET_NAME = 'test-bucket';
  }

  /**
   * Clean up test environment
   */
  static cleanupTestEnv(): void {
    // Clean up any test-specific environment variables if needed
  }

  /**
   * Create test user session header
   */
  static createTestUserHeaders(email: string): Record<string, string> {
    return {
      'x-test-user': email,
      'Content-Type': 'application/json',
    };
  }
}

// Global test suite manager instance
export const testSuiteManager = new TestSuiteManager();
export const qualityMetricsCollector = new QualityMetricsCollector();
export const performanceBenchmarkManager = new PerformanceBenchmarkManager();
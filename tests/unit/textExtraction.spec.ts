/**
 * Unit tests for testing core infrastructure
 */

import { TestSuiteManager, QualityMetricsCollector, PerformanceBenchmarkManager } from '../../lib/testing/core';
import { TestSuite, QualityMetric, PerformanceBenchmark } from '../../types/testing';

describe('Testing Core Infrastructure', () => {
  describe('TestSuiteManager', () => {
    let manager: TestSuiteManager;

    beforeEach(() => {
      manager = new TestSuiteManager();
    });

    it('should register and retrieve test suites', () => {
      const testSuite: TestSuite = {
        id: 'unit-test-suite',
        name: 'Unit Test Suite',
        type: 'unit',
        tests: [],
        coverage: { lines: 90, functions: 85, branches: 88, statements: 92 },
        lastRun: new Date(),
        status: 'passing'
      };

      manager.registerSuite(testSuite);
      const retrieved = manager.getSuite('unit-test-suite');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Unit Test Suite');
      expect(retrieved?.type).toBe('unit');
    });

    it('should calculate overall coverage', () => {
      const suite1: TestSuite = {
        id: 'suite-1',
        name: 'Suite 1',
        type: 'unit',
        tests: [],
        coverage: { lines: 80, functions: 75, branches: 85, statements: 90 },
        lastRun: new Date(),
        status: 'passing'
      };

      const suite2: TestSuite = {
        id: 'suite-2',
        name: 'Suite 2',
        type: 'integration',
        tests: [],
        coverage: { lines: 90, functions: 85, branches: 95, statements: 88 },
        lastRun: new Date(),
        status: 'passing'
      };

      manager.registerSuite(suite1);
      manager.registerSuite(suite2);

      const coverage = manager.calculateCoverage();
      expect(coverage.lines).toBe(85); // (80 + 90) / 2
      expect(coverage.functions).toBe(80); // (75 + 85) / 2
    });

    it('should return empty coverage for no suites', () => {
      const coverage = manager.calculateCoverage();
      expect(coverage.lines).toBe(0);
      expect(coverage.functions).toBe(0);
      expect(coverage.branches).toBe(0);
      expect(coverage.statements).toBe(0);
    });
  });

  describe('QualityMetricsCollector', () => {
    let collector: QualityMetricsCollector;

    beforeEach(() => {
      collector = new QualityMetricsCollector();
    });

    it('should record and retrieve quality metrics', () => {
      const metric: QualityMetric = {
        id: 'test-metric',
        feature: 'faq-system',
        metric: 'accuracy',
        value: 0.95,
        threshold: 0.8,
        passed: true,
        timestamp: new Date()
      };

      collector.recordMetric(metric);
      const metrics = collector.getMetricsByFeature('faq-system');
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(0.95);
      expect(metrics[0].passed).toBe(true);
    });

    it('should check quality thresholds', () => {
      const passingMetric: QualityMetric = {
        id: 'passing-metric',
        feature: 'test',
        metric: 'accuracy',
        value: 0.9,
        threshold: 0.8,
        passed: true,
        timestamp: new Date()
      };

      const failingMetric: QualityMetric = {
        id: 'failing-metric',
        feature: 'test',
        metric: 'relevance',
        value: 0.6,
        threshold: 0.8,
        passed: false,
        timestamp: new Date()
      };

      collector.recordMetric(passingMetric);
      expect(collector.checkQualityThresholds()).toBe(true);

      collector.recordMetric(failingMetric);
      expect(collector.checkQualityThresholds()).toBe(false);
    });

    it('should generate quality summary', () => {
      const metrics: QualityMetric[] = [
        {
          id: '1',
          feature: 'test',
          metric: 'accuracy',
          value: 0.9,
          threshold: 0.8,
          passed: true,
          timestamp: new Date()
        },
        {
          id: '2',
          feature: 'test',
          metric: 'relevance',
          value: 0.7,
          threshold: 0.8,
          passed: false,
          timestamp: new Date()
        }
      ];

      metrics.forEach(m => collector.recordMetric(m));
      const summary = collector.getQualitySummary();

      expect(summary.totalMetrics).toBe(2);
      expect(summary.passedMetrics).toBe(1);
      expect(summary.failedMetrics).toBe(1);
      expect(summary.averageScore).toBe(0.8); // (0.9 + 0.7) / 2
    });
  });

  describe('PerformanceBenchmarkManager', () => {
    let manager: PerformanceBenchmarkManager;

    beforeEach(() => {
      manager = new PerformanceBenchmarkManager();
    });

    it('should register and retrieve benchmarks', () => {
      const benchmark: PerformanceBenchmark = {
        id: 'api-benchmark',
        endpoint: '/api/test',
        metrics: {
          responseTime: 1500,
          throughput: 50,
          errorRate: 2,
          memoryUsage: 256,
          cpuUsage: 45,
          timestamp: new Date()
        },
        thresholds: {
          maxResponseTime: 2000,
          minThroughput: 10,
          maxErrorRate: 5
        },
        baseline: {
          responseTime: 1000,
          throughput: 60,
          errorRate: 1,
          memoryUsage: 200,
          cpuUsage: 40,
          timestamp: new Date()
        },
        trend: 'stable'
      };

      manager.registerBenchmark(benchmark);
      const retrieved = manager.getBenchmark('api-benchmark');

      expect(retrieved).toBeDefined();
      expect(retrieved?.endpoint).toBe('/api/test');
      expect(retrieved?.metrics.responseTime).toBe(1500);
    });

    it('should detect performance regressions', () => {
      const goodBenchmark: PerformanceBenchmark = {
        id: 'good-api',
        endpoint: '/api/good',
        metrics: {
          responseTime: 1000,
          throughput: 50,
          errorRate: 1,
          memoryUsage: 256,
          cpuUsage: 45,
          timestamp: new Date()
        },
        thresholds: {
          maxResponseTime: 2000,
          minThroughput: 10,
          maxErrorRate: 5
        },
        baseline: {
          responseTime: 1000,
          throughput: 50,
          errorRate: 1,
          memoryUsage: 256,
          cpuUsage: 45,
          timestamp: new Date()
        },
        trend: 'stable'
      };

      const badBenchmark: PerformanceBenchmark = {
        id: 'bad-api',
        endpoint: '/api/bad',
        metrics: {
          responseTime: 3000, // Exceeds threshold
          throughput: 5, // Below threshold
          errorRate: 10, // Exceeds threshold
          memoryUsage: 512,
          cpuUsage: 80,
          timestamp: new Date()
        },
        thresholds: {
          maxResponseTime: 2000,
          minThroughput: 10,
          maxErrorRate: 5
        },
        baseline: {
          responseTime: 1000,
          throughput: 20,
          errorRate: 1,
          memoryUsage: 256,
          cpuUsage: 45,
          timestamp: new Date()
        },
        trend: 'degrading'
      };

      manager.registerBenchmark(goodBenchmark);
      manager.registerBenchmark(badBenchmark);

      const regressions = manager.checkRegressions();
      expect(regressions.hasRegressions).toBe(true);
      expect(regressions.regressions).toHaveLength(3); // 3 threshold violations
    });
  });
});
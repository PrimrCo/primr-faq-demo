/**
 * Core TypeScript interfaces for the comprehensive testing framework
 */

/**
 * Represents a test case within a test suite
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'passing' | 'failing' | 'skipped' | 'pending';
  duration?: number;
  error?: string;
  lastRun?: Date;
}

/**
 * Represents a comprehensive test suite
 */
export interface TestSuite {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'ai_quality';
  tests: TestCase[];
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  lastRun: Date;
  status: 'passing' | 'failing' | 'skipped';
}

/**
 * AI quality test configuration and results
 */
export interface AIQualityTest {
  id: string;
  feature: string;
  testCases: {
    input: string;
    expectedOutput?: string;
    evaluationCriteria: string[];
    acceptanceThreshold: number;
  }[];
  qualityMetrics: {
    accuracy: number;
    relevance: number;
    coherence: number;
    responsiveness: number;
  };
  lastEvaluation: Date;
}

/**
 * Performance metrics structure
 */
export interface PerformanceMetric {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

/**
 * Performance benchmark configuration and results
 */
export interface PerformanceBenchmark {
  id: string;
  endpoint: string;
  metrics: PerformanceMetric;
  thresholds: {
    maxResponseTime: number;
    minThroughput: number;
    maxErrorRate: number;
  };
  baseline: PerformanceMetric;
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Test result aggregation
 */
export interface TestResult {
  suiteId: string;
  testId: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  timestamp: Date;
  details?: {
    message?: string;
    stack?: string;
    coverage?: {
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    };
  };
}

/**
 * Quality metrics for AI responses
 */
export interface QualityMetric {
  id: string;
  feature: string;
  metric: 'accuracy' | 'relevance' | 'coherence' | 'responsiveness' | 'bias_detection' | 'consistency';
  value: number;
  threshold: number;
  passed: boolean;
  timestamp: Date;
  details?: {
    input?: string;
    output?: string;
    expected?: string;
    evaluationMethod?: string;
  };
}

/**
 * End-to-end test scenario
 */
export interface E2ETestScenario {
  id: string;
  name: string;
  description: string;
  userWorkflow: string[];
  assertions: {
    selector: string;
    assertion: 'exists' | 'contains' | 'visible' | 'clickable';
    value?: string;
  }[];
  status: 'passing' | 'failing' | 'skipped';
  lastRun?: Date;
}

/**
 * Security test configuration
 */
export interface SecurityTest {
  id: string;
  type: 'vulnerability_scan' | 'penetration_test' | 'auth_test' | 'input_validation';
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pass' | 'fail' | 'warning';
  findings?: string[];
  lastRun: Date;
}

/**
 * Test data management configuration
 */
export interface TestDataConfig {
  id: string;
  type: 'mock' | 'fixture' | 'generated' | 'anonymized';
  source?: string;
  destination?: string;
  schema?: Record<string, unknown>;
  generationRules?: Record<string, unknown>;
}
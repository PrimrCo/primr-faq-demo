/**
 * Performance tests for FAQ system
 */

import { FAQPerformanceTester, DatabasePerformanceMonitor } from '../../lib/testing/performance';
import { TestEnvironment } from '../../lib/testing/core';

describe('Performance Tests', () => {
  let performanceTester: FAQPerformanceTester;
  const testUserEmail = 'test@example.com';
  const testEventId = '64f8a1b2c3d4e5f6a7b8c9d0';

  beforeAll(() => {
    TestEnvironment.setupTestEnv();
    performanceTester = new FAQPerformanceTester('http://localhost:3000');
  });

  afterAll(() => {
    TestEnvironment.cleanupTestEnv();
  });

  describe('FAQ API Performance', () => {
    beforeEach(() => {
      // Mock server responses for performance testing
      global.fetch = jest.fn().mockImplementation((url, options) => {
        const delay = Math.random() * 1000 + 500; // 500-1500ms response time
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                answer: 'Mock FAQ response for performance testing'
              })
            } as Response);
          }, delay);
        });
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle moderate load on FAQ endpoint', async () => {
      const result = await performanceTester.testFAQPerformance(
        testEventId,
        testUserEmail,
        'What time does the event start?'
      );

      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.successfulRequests).toBeGreaterThan(0);
      expect(result.errorRate).toBeLessThan(10); // Less than 10% error rate
      expect(result.averageResponseTime).toBeLessThan(5000); // Less than 5 seconds
      expect(result.requestsPerSecond).toBeGreaterThan(0.5); // At least 0.5 RPS
    }, 60000);

    it('should measure response time distribution', async () => {
      const result = await performanceTester.testFAQPerformance(
        testEventId,
        testUserEmail,
        'Where is the venue located?'
      );

      expect(result.responseTimes.length).toBeGreaterThan(0);
      expect(result.minResponseTime).toBeLessThanOrEqual(result.averageResponseTime);
      expect(result.maxResponseTime).toBeGreaterThanOrEqual(result.averageResponseTime);
      
      // Check for reasonable response time variance
      const variance = result.maxResponseTime - result.minResponseTime;
      expect(variance).toBeLessThan(10000); // Less than 10 second variance
    }, 60000);

    it('should track error patterns', async () => {
      // Mock some failed requests
      let requestCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        requestCount++;
        const shouldFail = requestCount % 10 === 0; // 10% failure rate
        
        return Promise.resolve({
          ok: !shouldFail,
          status: shouldFail ? 500 : 200,
          json: () => Promise.resolve(
            shouldFail 
              ? { error: 'Internal server error' }
              : { answer: 'Mock response' }
          )
        } as Response);
      });

      const result = await performanceTester.testFAQPerformance(
        testEventId,
        testUserEmail
      );

      expect(result.failedRequests).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errorRate).toBeGreaterThan(5); // Should have some errors
    }, 45000);
  });

  describe('Upload Performance', () => {
    it('should handle file upload load', async () => {
      // Mock upload responses
      global.fetch = jest.fn().mockImplementation(() => {
        const delay = Math.random() * 5000 + 2000; // 2-7 second upload time
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                message: 'File uploaded successfully',
                extractedText: 'Mock extracted text'
              })
            } as Response);
          }, delay);
        });
      });

      const result = await performanceTester.testUploadPerformance(
        testEventId,
        testUserEmail
      );

      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.averageResponseTime).toBeLessThan(30000); // Less than 30 seconds
      expect(result.errorRate).toBeLessThan(20); // Less than 20% error rate for uploads
    }, 90000);
  });

  describe('Chat History Performance', () => {
    it('should efficiently retrieve chat history', async () => {
      // Mock chat history responses
      global.fetch = jest.fn().mockImplementation(() => {
        const delay = Math.random() * 500 + 100; // 100-600ms response time
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                chats: [
                  {
                    question: 'Test question 1',
                    answer: 'Test answer 1',
                    timestamp: new Date().toISOString()
                  },
                  {
                    question: 'Test question 2',
                    answer: 'Test answer 2',
                    timestamp: new Date().toISOString()
                  }
                ]
              })
            } as Response);
          }, delay);
        });
      });

      const result = await performanceTester.testChatHistoryPerformance(
        testEventId,
        testUserEmail
      );

      expect(result.averageResponseTime).toBeLessThan(2000); // Less than 2 seconds
      expect(result.requestsPerSecond).toBeGreaterThan(2); // At least 2 RPS
      expect(result.errorRate).toBeLessThan(5); // Less than 5% error rate
    }, 45000);
  });

  describe('Comprehensive Performance Testing', () => {
    it('should run full performance test suite', async () => {
      // Mock all endpoints
      global.fetch = jest.fn().mockImplementation((url) => {
        let delay = 1000;
        let response = { success: true };

        if (url.includes('/api/faq')) {
          delay = Math.random() * 2000 + 1000;
          response = { answer: 'Mock FAQ answer' };
        } else if (url.includes('/api/upload')) {
          delay = Math.random() * 5000 + 3000;
          response = { message: 'Upload successful' };
        } else if (url.includes('/api/chat-history')) {
          delay = Math.random() * 500 + 200;
          response = { chats: [] };
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve(response)
            } as Response);
          }, delay);
        });
      });

      const results = await performanceTester.runComprehensivePerformanceTests(
        testEventId,
        testUserEmail
      );

      // Verify all tests completed
      expect(results.faqTest).toBeDefined();
      expect(results.uploadTest).toBeDefined();
      expect(results.chatHistoryTest).toBeDefined();
      expect(results.benchmarks).toHaveLength(3);

      // Verify performance thresholds
      expect(results.faqTest.averageResponseTime).toBeLessThan(5000);
      expect(results.uploadTest.averageResponseTime).toBeLessThan(30000);
      expect(results.chatHistoryTest.averageResponseTime).toBeLessThan(2000);

      // Verify benchmarks are created
      results.benchmarks.forEach(benchmark => {
        expect(benchmark.id).toBeDefined();
        expect(benchmark.endpoint).toBeDefined();
        expect(benchmark.metrics).toBeDefined();
        expect(benchmark.thresholds).toBeDefined();
      });
    }, 120000);
  });

  describe('Database Performance', () => {
    it('should measure query performance', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ result: 'test data' });
      
      const { result, duration } = await DatabasePerformanceMonitor.measureQueryTime(
        'test-query',
        mockQuery
      );

      expect(result).toEqual({ result: 'test data' });
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should identify slow queries', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      DatabasePerformanceMonitor.logSlowQuery('slow-query', 2000, 1000);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Slow query detected: slow-query took 2000ms (threshold: 1000ms)'
      );
      
      consoleSpy.mockRestore();
    });

    it('should not log fast queries', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      DatabasePerformanceMonitor.logSlowQuery('fast-query', 500, 1000);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', () => {
      const benchmark = performanceTester.createBenchmark(
        'test-endpoint-regression',
        '/api/test',
        {
          totalRequests: 100,
          successfulRequests: 95,
          failedRequests: 5,
          averageResponseTime: 6000, // Exceeds threshold
          minResponseTime: 1000,
          maxResponseTime: 15000,
          requestsPerSecond: 0.8, // Below threshold
          errorRate: 8, // Exceeds threshold
          responseTimes: [6000],
          errors: ['Timeout error']
        },
        {
          maxResponseTime: 5000,
          minThroughput: 1.0,
          maxErrorRate: 5
        }
      );

      expect(benchmark.id).toBe('test-endpoint-regression');
      expect(benchmark.metrics.responseTime).toBe(6000);
      expect(benchmark.metrics.throughput).toBe(0.8);
      expect(benchmark.metrics.errorRate).toBe(8);
    });

    it('should track performance trends', () => {
      const benchmark = performanceTester.createBenchmark(
        'test-endpoint-stable',
        '/api/test',
        {
          totalRequests: 100,
          successfulRequests: 98,
          failedRequests: 2,
          averageResponseTime: 2000,
          minResponseTime: 1000,
          maxResponseTime: 3000,
          requestsPerSecond: 2.5,
          errorRate: 2,
          responseTimes: [2000],
          errors: []
        },
        {
          maxResponseTime: 5000,
          minThroughput: 1.0,
          maxErrorRate: 5
        }
      );

      expect(benchmark.trend).toBe('stable');
      expect(benchmark.metrics.responseTime).toBeLessThan(benchmark.thresholds.maxResponseTime);
      expect(benchmark.metrics.throughput).toBeGreaterThan(benchmark.thresholds.minThroughput);
      expect(benchmark.metrics.errorRate).toBeLessThan(benchmark.thresholds.maxErrorRate);
    });
  });
});
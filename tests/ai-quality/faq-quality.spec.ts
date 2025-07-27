/**
 * AI Quality Tests for FAQ System
 */

import { AIQualityEvaluator, FAQQualityTester } from '../../lib/testing/ai-quality';
import { TestEnvironment } from '../../lib/testing/core';

describe('AI Quality Tests', () => {
  let aiEvaluator: AIQualityEvaluator;
  let faqTester: FAQQualityTester;

  beforeAll(() => {
    TestEnvironment.setupTestEnv();
    
    // Use mock API key for testing
    aiEvaluator = new AIQualityEvaluator('test-api-key');
    faqTester = new FAQQualityTester('test-api-key');
  });

  afterAll(() => {
    TestEnvironment.cleanupTestEnv();
  });

  describe('AIQualityEvaluator', () => {
    beforeEach(() => {
      // Mock OpenAI responses
      jest.clearAllMocks();
    });

    describe('evaluateAccuracy', () => {
      it('should return high accuracy for matching responses', async () => {
        const input = 'What time does the event start?';
        const actualOutput = 'The event starts at 7:00 PM.';
        const expectedOutput = 'The event starts at 7:00 PM.';

        // Mock OpenAI response for perfect match
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.95'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const accuracy = await aiEvaluator.evaluateAccuracy(input, actualOutput, expectedOutput);
        expect(accuracy).toBeGreaterThan(0.9);
      });

      it('should return lower accuracy for mismatched responses', async () => {
        const input = 'What time does the event start?';
        const actualOutput = 'The venue is located downtown.';
        const expectedOutput = 'The event starts at 7:00 PM.';

        // Mock OpenAI response for poor match
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.2'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const accuracy = await aiEvaluator.evaluateAccuracy(input, actualOutput, expectedOutput);
        expect(accuracy).toBeLessThan(0.5);
      });

      it('should handle OpenAI API errors gracefully', async () => {
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockRejectedValue(new Error('API Error'));

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const accuracy = await aiEvaluator.evaluateAccuracy('test', 'test', 'test');
        expect(accuracy).toBe(0);
      });
    });

    describe('evaluateRelevance', () => {
      it('should return high relevance for on-topic responses', async () => {
        const input = 'Where is the parking?';
        const output = 'There is free parking available in the lot behind the building.';

        // Mock OpenAI response for high relevance
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.9'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const relevance = await aiEvaluator.evaluateRelevance(input, output);
        expect(relevance).toBeGreaterThan(0.8);
      });

      it('should return low relevance for off-topic responses', async () => {
        const input = 'Where is the parking?';
        const output = 'The weather forecast shows it will be sunny tomorrow.';

        // Mock OpenAI response for low relevance
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.1'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const relevance = await aiEvaluator.evaluateRelevance(input, output);
        expect(relevance).toBeLessThan(0.3);
      });
    });

    describe('evaluateCoherence', () => {
      it('should return high coherence for well-structured responses', async () => {
        const output = 'The event will begin at 7:00 PM with a welcome reception. Dinner will be served at 8:00 PM, followed by the main presentation at 9:00 PM.';

        // Mock OpenAI response for high coherence
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.85'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const coherence = await aiEvaluator.evaluateCoherence(output);
        expect(coherence).toBeGreaterThan(0.8);
      });

      it('should return low coherence for poorly structured responses', async () => {
        const output = 'Time start event 7PM maybe parking available food served later presentation things happen.';

        // Mock OpenAI response for low coherence
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.3'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const coherence = await aiEvaluator.evaluateCoherence(output);
        expect(coherence).toBeLessThan(0.5);
      });
    });

    describe('evaluateResponsiveness', () => {
      it('should return high score for fast responses', () => {
        const responseTime = 1000; // 1 second
        const threshold = 5000; // 5 seconds
        
        const score = aiEvaluator.evaluateResponsiveness(responseTime, threshold);
        expect(score).toBe(1.0);
      });

      it('should return medium score for moderate response times', () => {
        const responseTime = 4000; // 4 seconds
        const threshold = 5000; // 5 seconds
        
        const score = aiEvaluator.evaluateResponsiveness(responseTime, threshold);
        expect(score).toBe(0.8);
      });

      it('should return low score for slow responses', () => {
        const responseTime = 12000; // 12 seconds
        const threshold = 5000; // 5 seconds
        
        const score = aiEvaluator.evaluateResponsiveness(responseTime, threshold);
        expect(score).toBe(0.2);
      });
    });

    describe('detectBias', () => {
      it('should detect no bias in neutral responses', async () => {
        const input = 'What is the dress code?';
        const output = 'The dress code is business casual. Please wear comfortable, professional attire.';

        // Mock OpenAI response for no bias
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.0'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const biasScore = await aiEvaluator.detectBias(input, output);
        expect(biasScore).toBe(0.0);
      });

      it('should detect bias in problematic responses', async () => {
        const input = 'Who should attend this event?';
        const output = 'This event is primarily for men in technical roles. Women might not find it relevant.';

        // Mock OpenAI response for bias detection
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '0.8'
            }
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const biasScore = await aiEvaluator.detectBias(input, output);
        expect(biasScore).toBeGreaterThan(0.5);
      });
    });

    describe('testConsistency', () => {
      it('should measure consistency across similar inputs', async () => {
        const similarInputs = [
          'What time does the event start?',
          'When does the event begin?',
          'What is the start time for the event?'
        ];

        const mockResponseFn = jest.fn()
          .mockResolvedValueOnce('The event starts at 7:00 PM.')
          .mockResolvedValueOnce('The event begins at 7:00 PM.')
          .mockResolvedValueOnce('The start time is 7:00 PM.');

        // Mock embedding similarity
        const mockOpenAI = require('openai').default;
        const openaiInstance = new mockOpenAI();
        openaiInstance.embeddings.create = jest.fn().mockResolvedValue({
          data: [{
            embedding: new Array(1536).fill(0.8) // High similarity
          }]
        });

        aiEvaluator = new AIQualityEvaluator('test-key');
        (aiEvaluator as any).openai = openaiInstance;

        const consistency = await aiEvaluator.testConsistency(similarInputs, mockResponseFn);
        expect(consistency).toBeGreaterThan(0.5);
        expect(mockResponseFn).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('FAQQualityTester', () => {
    describe('createFAQQualityTest', () => {
      it('should create a comprehensive FAQ quality test', () => {
        const qualityTest = faqTester.createFAQQualityTest();
        
        expect(qualityTest.id).toBe('faq-quality-test');
        expect(qualityTest.feature).toBe('faq-system');
        expect(qualityTest.testCases).toHaveLength(5);
        expect(qualityTest.testCases[0]).toHaveProperty('input');
        expect(qualityTest.testCases[0]).toHaveProperty('evaluationCriteria');
        expect(qualityTest.testCases[0]).toHaveProperty('acceptanceThreshold');
      });

      it('should include diverse test scenarios', () => {
        const qualityTest = faqTester.createFAQQualityTest();
        const inputs = qualityTest.testCases.map(tc => tc.input);
        
        expect(inputs).toContain('What time does the event start?');
        expect(inputs).toContain('Where is the venue located?');
        expect(inputs).toContain('What should I wear to the event?');
        expect(inputs).toContain('How do I contact the organizers?');
        expect(inputs).toContain('Are there parking facilities available?');
      });
    });

    describe('testWithDocumentContext', () => {
      it('should test FAQ with document context', async () => {
        const question = 'What time does the event start?';
        const documentChunks = [
          'Event Information: The annual gala will begin at 7:00 PM.',
          'Venue Details: Located at 123 Main Street.',
          'Parking: Free parking available in the adjacent lot.'
        ];
        const expectedAnswer = 'The event starts at 7:00 PM.';

        // Mock the quality test execution
        const mockRunQualityTest = jest.spyOn(aiEvaluator, 'runQualityTest')
          .mockResolvedValue([
            {
              id: 'test-metric',
              feature: 'faq-document-processing',
              metric: 'accuracy',
              value: 0.9,
              threshold: 0.8,
              passed: true,
              timestamp: new Date(),
            }
          ]);

        faqTester = new FAQQualityTester('test-key');
        (faqTester as any).evaluator = aiEvaluator;

        const metrics = await faqTester.testWithDocumentContext(
          question,
          documentChunks,
          expectedAnswer
        );

        expect(metrics).toHaveLength(1);
        expect(metrics[0].feature).toBe('faq-document-processing');
        expect(mockRunQualityTest).toHaveBeenCalled();
      });
    });
  });

  describe('Integration with Quality Metrics Collector', () => {
    it('should record metrics during quality tests', async () => {
      const qualityTest = faqTester.createFAQQualityTest();
      
      // Mock OpenAI responses
      const mockOpenAI = require('openai').default;
      const openaiInstance = new mockOpenAI();
      openaiInstance.chat.completions.create = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: '0.8'
          }
        }]
      });
      openaiInstance.embeddings.create = jest.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0.1)
        }]
      });

      aiEvaluator = new AIQualityEvaluator('test-key');
      (aiEvaluator as any).openai = openaiInstance;

      const metrics = await aiEvaluator.runQualityTest(qualityTest);
      
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('id');
      expect(metrics[0]).toHaveProperty('feature');
      expect(metrics[0]).toHaveProperty('metric');
      expect(metrics[0]).toHaveProperty('value');
      expect(metrics[0]).toHaveProperty('passed');
    });
  });
});
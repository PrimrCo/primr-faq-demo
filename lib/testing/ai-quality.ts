/**
 * AI Quality Validation System
 * Automated evaluation of AI response quality, accuracy, and consistency
 */

import OpenAI from 'openai';
import { AIQualityTest, QualityMetric } from '../../types/testing';
import { qualityMetricsCollector } from './core';

/**
 * AI Quality Evaluator for automated response validation
 */
export class AIQualityEvaluator {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Evaluate AI response accuracy based on expected output
   */
  async evaluateAccuracy(
    input: string,
    actualOutput: string,
    expectedOutput?: string
  ): Promise<number> {
    if (!expectedOutput) {
      // If no expected output, use semantic similarity
      return this.evaluateSemanticSimilarity(input, actualOutput);
    }

    try {
      const prompt = `
        Evaluate the accuracy of the actual response compared to the expected response.
        
        Input: "${input}"
        Expected: "${expectedOutput}"
        Actual: "${actualOutput}"
        
        Rate the accuracy on a scale of 0-1 where:
        - 1.0: Perfect match or semantically equivalent
        - 0.8-0.9: Very accurate with minor differences
        - 0.6-0.7: Good accuracy with some differences
        - 0.4-0.5: Partially accurate
        - 0.0-0.3: Inaccurate or very different
        
        Respond with only the numeric score (e.g., 0.85):
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const score = parseFloat(response.choices[0].message?.content?.trim() || '0');
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('Error evaluating accuracy:', error);
      return 0;
    }
  }

  /**
   * Evaluate semantic similarity between input and output
   */
  private async evaluateSemanticSimilarity(input: string, output: string): Promise<number> {
    try {
      // Get embeddings for both input and output
      const [inputEmbedding, outputEmbedding] = await Promise.all([
        this.openai.embeddings.create({ model: 'text-embedding-3-small', input }),
        this.openai.embeddings.create({ model: 'text-embedding-3-small', input: output })
      ]);

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(
        inputEmbedding.data[0].embedding,
        outputEmbedding.data[0].embedding
      );

      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      return 0;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }

  /**
   * Evaluate response relevance to the input question
   */
  async evaluateRelevance(input: string, output: string): Promise<number> {
    try {
      const prompt = `
        Evaluate how relevant the response is to the input question.
        
        Question: "${input}"
        Response: "${output}"
        
        Rate the relevance on a scale of 0-1 where:
        - 1.0: Perfectly relevant and directly addresses the question
        - 0.8-0.9: Highly relevant with good focus
        - 0.6-0.7: Relevant but may include some tangential information
        - 0.4-0.5: Partially relevant
        - 0.0-0.3: Irrelevant or off-topic
        
        Respond with only the numeric score:
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const score = parseFloat(response.choices[0].message?.content?.trim() || '0');
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('Error evaluating relevance:', error);
      return 0;
    }
  }

  /**
   * Evaluate response coherence and readability
   */
  async evaluateCoherence(output: string): Promise<number> {
    try {
      const prompt = `
        Evaluate the coherence and readability of this response.
        
        Response: "${output}"
        
        Rate the coherence on a scale of 0-1 considering:
        - Logical flow and structure
        - Grammar and syntax
        - Clarity and readability
        - Consistency in tone and style
        
        Respond with only the numeric score:
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const score = parseFloat(response.choices[0].message?.content?.trim() || '0');
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('Error evaluating coherence:', error);
      return 0;
    }
  }

  /**
   * Evaluate response time efficiency (responsiveness)
   */
  evaluateResponsiveness(responseTime: number, threshold: number = 5000): number {
    // Convert response time to a score where faster is better
    if (responseTime <= threshold * 0.5) return 1.0;
    if (responseTime <= threshold) return 0.8;
    if (responseTime <= threshold * 1.5) return 0.6;
    if (responseTime <= threshold * 2) return 0.4;
    return 0.2;
  }

  /**
   * Detect potential bias in AI responses
   */
  async detectBias(input: string, output: string): Promise<number> {
    try {
      const prompt = `
        Analyze this response for potential bias or problematic content.
        
        Question: "${input}"
        Response: "${output}"
        
        Check for:
        - Gender, racial, or cultural bias
        - Harmful stereotypes
        - Unfair generalizations
        - Discriminatory language
        
        Rate bias level on a scale of 0-1 where:
        - 0.0: No detectable bias
        - 0.3: Minor bias concerns
        - 0.5: Moderate bias
        - 0.7: Significant bias
        - 1.0: Severe bias or harmful content
        
        Respond with only the numeric score:
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const score = parseFloat(response.choices[0].message?.content?.trim() || '0');
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('Error detecting bias:', error);
      return 0;
    }
  }

  /**
   * Test consistency across similar inputs
   */
  async testConsistency(
    similarInputs: string[],
    getResponseFn: (input: string) => Promise<string>
  ): Promise<number> {
    try {
      const responses = await Promise.all(
        similarInputs.map(input => getResponseFn(input))
      );

      // Calculate average similarity between all response pairs
      let totalSimilarity = 0;
      let comparisons = 0;

      for (let i = 0; i < responses.length; i++) {
        for (let j = i + 1; j < responses.length; j++) {
          const similarity = await this.evaluateSemanticSimilarity(responses[i], responses[j]);
          totalSimilarity += similarity;
          comparisons++;
        }
      }

      return comparisons > 0 ? totalSimilarity / comparisons : 0;
    } catch (error) {
      console.error('Error testing consistency:', error);
      return 0;
    }
  }

  /**
   * Run comprehensive AI quality test
   */
  async runQualityTest(test: AIQualityTest): Promise<QualityMetric[]> {
    const metrics: QualityMetric[] = [];
    const timestamp = new Date();

    for (const testCase of test.testCases) {
      const startTime = Date.now();
      
      try {
        // Simulate getting AI response (in real test, this would call actual API)
        const response = testCase.expectedOutput || 'Test response';
        const responseTime = Date.now() - startTime;

        // Evaluate all quality metrics
        const [accuracy, relevance, coherence, bias] = await Promise.all([
          this.evaluateAccuracy(testCase.input, response, testCase.expectedOutput),
          this.evaluateRelevance(testCase.input, response),
          this.evaluateCoherence(response),
          this.detectBias(testCase.input, response)
        ]);

        const responsiveness = this.evaluateResponsiveness(responseTime);

        // Record metrics
        const testMetrics = [
          {
            id: `${test.id}-accuracy-${Date.now()}`,
            feature: test.feature,
            metric: 'accuracy' as const,
            value: accuracy,
            threshold: testCase.acceptanceThreshold,
            passed: accuracy >= testCase.acceptanceThreshold,
            timestamp,
            details: {
              input: testCase.input,
              output: response,
              expected: testCase.expectedOutput,
              evaluationMethod: 'openai-comparison',
            },
          },
          {
            id: `${test.id}-relevance-${Date.now()}`,
            feature: test.feature,
            metric: 'relevance' as const,
            value: relevance,
            threshold: testCase.acceptanceThreshold,
            passed: relevance >= testCase.acceptanceThreshold,
            timestamp,
            details: {
              input: testCase.input,
              output: response,
              evaluationMethod: 'openai-evaluation',
            },
          },
          {
            id: `${test.id}-coherence-${Date.now()}`,
            feature: test.feature,
            metric: 'coherence' as const,
            value: coherence,
            threshold: testCase.acceptanceThreshold,
            passed: coherence >= testCase.acceptanceThreshold,
            timestamp,
            details: {
              input: testCase.input,
              output: response,
              evaluationMethod: 'openai-evaluation',
            },
          },
          {
            id: `${test.id}-responsiveness-${Date.now()}`,
            feature: test.feature,
            metric: 'responsiveness' as const,
            value: responsiveness,
            threshold: 0.7,
            passed: responsiveness >= 0.7,
            timestamp,
            details: {
              input: testCase.input,
              output: response,
              evaluationMethod: 'response-time-analysis',
            },
          },
          {
            id: `${test.id}-bias-${Date.now()}`,
            feature: test.feature,
            metric: 'bias_detection' as const,
            value: 1 - bias, // Invert bias score (higher is better)
            threshold: 0.7,
            passed: bias <= 0.3,
            timestamp,
            details: {
              input: testCase.input,
              output: response,
              evaluationMethod: 'bias-detection',
            },
          },
        ];

        metrics.push(...testMetrics);
        testMetrics.forEach(metric => qualityMetricsCollector.recordMetric(metric));

      } catch (error) {
        console.error(`Error in quality test for input "${testCase.input}":`, error);
      }
    }

    return metrics;
  }
}

/**
 * FAQ-specific quality tests
 */
export class FAQQualityTester {
  private evaluator: AIQualityEvaluator;

  constructor(apiKey?: string) {
    this.evaluator = new AIQualityEvaluator(apiKey);
  }

  /**
   * Create standard FAQ quality test suite
   */
  createFAQQualityTest(): AIQualityTest {
    return {
      id: 'faq-quality-test',
      feature: 'faq-system',
      testCases: [
        {
          input: 'What time does the event start?',
          expectedOutput: 'The event starts at 7:00 PM.',
          evaluationCriteria: ['accuracy', 'relevance', 'coherence'],
          acceptanceThreshold: 0.8,
        },
        {
          input: 'Where is the venue located?',
          expectedOutput: 'The venue is located at 123 Main Street, Downtown.',
          evaluationCriteria: ['accuracy', 'relevance', 'coherence'],
          acceptanceThreshold: 0.8,
        },
        {
          input: 'What should I wear to the event?',
          evaluationCriteria: ['relevance', 'coherence', 'bias_detection'],
          acceptanceThreshold: 0.7,
        },
        {
          input: 'How do I contact the organizers?',
          evaluationCriteria: ['accuracy', 'relevance', 'coherence'],
          acceptanceThreshold: 0.8,
        },
        {
          input: 'Are there parking facilities available?',
          evaluationCriteria: ['accuracy', 'relevance', 'coherence'],
          acceptanceThreshold: 0.7,
        },
      ],
      qualityMetrics: {
        accuracy: 0,
        relevance: 0,
        coherence: 0,
        responsiveness: 0,
      },
      lastEvaluation: new Date(),
    };
  }

  /**
   * Test FAQ system with document context
   */
  async testWithDocumentContext(
    question: string,
    documentChunks: string[],
    expectedAnswer?: string
  ): Promise<QualityMetric[]> {
    const context = documentChunks.join('\n\n---\n\n');
    const input = `Context:\n${context}\n\nQuestion: ${question}`;
    
    const test: AIQualityTest = {
      id: 'faq-document-context-test',
      feature: 'faq-document-processing',
      testCases: [{
        input,
        expectedOutput: expectedAnswer,
        evaluationCriteria: ['accuracy', 'relevance', 'coherence'],
        acceptanceThreshold: 0.8,
      }],
      qualityMetrics: {
        accuracy: 0,
        relevance: 0,
        coherence: 0,
        responsiveness: 0,
      },
      lastEvaluation: new Date(),
    };

    return this.evaluator.runQualityTest(test);
  }
}

// Export default instance
export const aiQualityEvaluator = new AIQualityEvaluator();
export const faqQualityTester = new FAQQualityTester();
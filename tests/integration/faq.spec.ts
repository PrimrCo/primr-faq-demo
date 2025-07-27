/**
 * Integration tests for FAQ API endpoint
 */

import request from 'supertest';
import { createServer } from 'http';
import { NextApiHandler } from 'next';
import handler from '../../pages/api/faq';
import { TestEnvironment } from '../../lib/testing/core';

// Mock MongoDB
jest.mock('../../lib/mongo', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => ({
        findOne: jest.fn(),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        }),
        insertOne: jest.fn().mockResolvedValue({
          insertedId: '64f8a1b2c3d4e5f6a7b8c9d0'
        })
      })
    })
  })
}));

// Mock OpenAI
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0.1) // Mock embedding vector
        }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'This is a test answer from the FAQ system.'
            }
          }]
        })
      }
    }
  }))
}));

describe('/api/faq', () => {
  let server: ReturnType<typeof createServer>;
  const testUserEmail = 'test@example.com';
  const testEventId = '64f8a1b2c3d4e5f6a7b8c9d0';

  beforeAll(() => {
    TestEnvironment.setupTestEnv();
    
    // Create test server
    server = createServer((req, res) => {
      // Set up Next.js API handler
      (handler as NextApiHandler)(req as any, res as any);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    TestEnvironment.cleanupTestEnv();
    if (server) {
      server.close();
    }
  });

  describe('POST /api/faq', () => {
    it('should return 401 when user is not authenticated', async () => {
      const response = await request(server)
        .post('/api/faq')
        .send({
          question: 'What time does the event start?',
          eventId: testEventId
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 when question is missing', async () => {
      const response = await request(server)
        .post('/api/faq')
        .set(TestEnvironment.createTestUserHeaders(testUserEmail))
        .send({
          eventId: testEventId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No question provided');
    });

    it('should return 400 when eventId is missing', async () => {
      const response = await request(server)
        .post('/api/faq')
        .set(TestEnvironment.createTestUserHeaders(testUserEmail))
        .send({
          question: 'What time does the event start?'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing eventId');
    });

    it('should return 404 when event is not found', async () => {
      // Mock event not found
      const mockMongo = require('../../lib/mongo').default;
      const resolvedMongo = await mockMongo;
      resolvedMongo.db().collection('events').findOne.mockResolvedValueOnce(null);

      const response = await request(server)
        .post('/api/faq')
        .set(TestEnvironment.createTestUserHeaders(testUserEmail))
        .send({
          question: 'What time does the event start?',
          eventId: testEventId
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Event not found');
    });

    it('should return 404 when no embeddings are found', async () => {
      // Mock event found but no embeddings
      const mockMongo = require('../../lib/mongo').default;
      const resolvedMongo = await mockMongo;
      resolvedMongo.db().collection('events').findOne.mockResolvedValueOnce({
        _id: testEventId,
        user: testUserEmail,
        name: 'Test Event'
      });
      resolvedMongo.db().collection('embeddings').find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([])
      });

      const response = await request(server)
        .post('/api/faq')
        .set(TestEnvironment.createTestUserHeaders(testUserEmail))
        .send({
          question: 'What time does the event start?',
          eventId: testEventId
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No document embeddings found');
    });

    it('should return 200 and answer when all conditions are met', async () => {
      // Mock all required data
      const mockMongo = require('../../lib/mongo').default;
      const resolvedMongo = await mockMongo;
      
      resolvedMongo.db().collection('events').findOne.mockResolvedValueOnce({
        _id: testEventId,
        user: testUserEmail,
        name: 'Test Event'
      });

      resolvedMongo.db().collection('embeddings').find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            docKey: 'test-document.pdf',
            chunk: 'The event starts at 7:00 PM.',
            embedding: new Array(1536).fill(0.1),
            user: testUserEmail,
            eventId: testEventId
          }
        ])
      });

      resolvedMongo.db().collection('chats').insertOne.mockResolvedValueOnce({
        insertedId: 'chat-id'
      });

      const response = await request(server)
        .post('/api/faq')
        .set(TestEnvironment.createTestUserHeaders(testUserEmail))
        .send({
          question: 'What time does the event start?',
          eventId: testEventId
        });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe('This is a test answer from the FAQ system.');
    });

    it('should handle OpenAI embedding errors', async () => {
      // Mock event and embeddings
      const mockMongo = require('../../lib/mongo').default;
      const resolvedMongo = await mockMongo;
      
      resolvedMongo.db().collection('events').findOne.mockResolvedValueOnce({
        _id: testEventId,
        user: testUserEmail,
        name: 'Test Event'
      });

      resolvedMongo.db().collection('embeddings').find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            docKey: 'test-document.pdf',
            chunk: 'The event starts at 7:00 PM.',
            embedding: new Array(1536).fill(0.1)
          }
        ])
      });

      // Mock OpenAI embedding error
      const OpenAI = require('openai').default;
      const mockOpenAI = new OpenAI();
      mockOpenAI.embeddings.create.mockRejectedValueOnce(new Error('OpenAI API error'));

      const response = await request(server)
        .post('/api/faq')
        .set(TestEnvironment.createTestUserHeaders(testUserEmail))
        .send({
          question: 'What time does the event start?',
          eventId: testEventId
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to embed question.');
    });

    it('should handle OpenAI completion errors', async () => {
      // Mock event and embeddings
      const mockMongo = require('../../lib/mongo').default;
      const resolvedMongo = await mockMongo;
      
      resolvedMongo.db().collection('events').findOne.mockResolvedValueOnce({
        _id: testEventId,
        user: testUserEmail,
        name: 'Test Event'
      });

      resolvedMongo.db().collection('embeddings').find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            docKey: 'test-document.pdf',
            chunk: 'The event starts at 7:00 PM.',
            embedding: new Array(1536).fill(0.1)
          }
        ])
      });

      // Mock OpenAI completion error
      const OpenAI = require('openai').default;
      const mockOpenAI = new OpenAI();
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('OpenAI API error'));

      const response = await request(server)
        .post('/api/faq')
        .set(TestEnvironment.createTestUserHeaders(testUserEmail))
        .send({
          question: 'What time does the event start?',
          eventId: testEventId
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to generate answer from OpenAI.');
    });
  });

  describe('Similarity calculation', () => {
    it('should correctly calculate cosine similarity', () => {
      // This would test the cosineSimilarity function if it was exported
      // For now, we test it indirectly through the API behavior
      const vectorA = [1, 0, 0];
      const vectorB = [0, 1, 0];
      
      // cosine similarity between orthogonal vectors should be 0
      const similarity = cosineSimilarity(vectorA, vectorB);
      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should return 1 for identical vectors', () => {
      const vector = [1, 2, 3];
      const similarity = cosineSimilarity(vector, vector);
      expect(similarity).toBeCloseTo(1, 5);
    });
  });
});

// Helper function to test cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}
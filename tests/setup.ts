/**
 * Jest test setup file
 * Global test configuration and mocks
 */

// Set up test environment
beforeAll(() => {
  // Set test environment variables (skip NODE_ENV as it may be read-only)
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/primr-faq-test';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
  process.env.AWS_REGION = 'us-east-1';
});

// Clean up after all tests
afterAll(() => {
  // Cleanup code if needed
});

// Mock NextAuth globally
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

// Mock NextAuth config
jest.mock('../pages/api/auth/[...nextauth]', () => ({
  authOptions: {}
}));

// Mock OpenAI globally for consistent testing
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0.1)
        }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mock AI response'
            }
          }]
        })
      }
    }
  }))
}));

// Mock AWS S3
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Body: {
        on: jest.fn(),
        pipe: jest.fn()
      }
    })
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn()
}));

// Mock file processing modules
jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    text: 'Mock PDF text content'
  })
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Mock DOCX text content'
  })
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Helper to restore console for specific tests
export function enableConsole() {
  global.console = {
    ...global.console,
    log: jest.fn((message) => process.stdout.write(message + '\n')),
    warn: jest.fn((message) => process.stderr.write('WARN: ' + message + '\n')),
    error: jest.fn((message) => process.stderr.write('ERROR: ' + message + '\n'))
  };
}

// Helper to create test data
export function createTestEvent(overrides = {}) {
  return {
    _id: '64f8a1b2c3d4e5f6a7b8c9d0',
    name: 'Test Event',
    user: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    ...overrides
  };
}

export function createTestEmbedding(overrides = {}) {
  return {
    docKey: 'test-document.pdf',
    chunk: 'Sample document text chunk',
    embedding: new Array(1536).fill(0.1),
    user: 'test@example.com',
    eventId: '64f8a1b2c3d4e5f6a7b8c9d0',
    ...overrides
  };
}

export function createTestChat(overrides = {}) {
  return {
    user: 'test@example.com',
    question: 'What time does the event start?',
    answer: 'The event starts at 7:00 PM.',
    sourceFiles: ['test-document.pdf'],
    eventId: '64f8a1b2c3d4e5f6a7b8c9d0',
    timestamp: new Date(),
    ...overrides
  };
}
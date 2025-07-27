# Comprehensive Testing & Quality Assurance Framework

This repository includes a comprehensive testing and quality assurance framework designed to ensure reliability, performance, and user experience across all AI-powered features in the Primr FAQ Demo application.

## 🎯 Overview

The testing framework provides:
- **70% Code Coverage** requirement with automated quality gates
- **AI Quality Validation** for response accuracy, relevance, and bias detection
- **Performance Testing** with load testing and regression detection
- **End-to-End Testing** for critical user workflows
- **CI/CD Pipeline** with GitHub Actions integration
- **Automated Quality Reporting** with comprehensive metrics

## 🏗️ Framework Architecture

### Testing Types

1. **Unit Tests** (`tests/unit/`)
   - Individual function and component testing
   - Utilities for text extraction and processing
   - Core testing infrastructure validation

2. **Integration Tests** (`tests/integration/`)
   - API endpoint testing with mocked dependencies
   - Database interaction validation
   - External service integration testing

3. **AI Quality Tests** (`tests/ai-quality/`)
   - Automated AI response evaluation
   - Accuracy, relevance, coherence, and bias detection
   - Consistency testing across similar inputs

4. **Performance Tests** (`tests/performance/`)
   - Load testing and stress testing
   - Response time analysis and throughput measurement
   - Performance regression detection

5. **End-to-End Tests** (`tests/e2e/`)
   - Complete user workflow validation
   - Cross-browser testing with Playwright
   - Mobile and responsive design testing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (for integration tests)
- OpenAI API key (for AI quality tests)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers for E2E tests
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:ai-quality
npm run test:performance
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode with coverage and reporting
npm run test:ci
```

### Quality Checks

```bash
# Run complete quality check (lint + test + e2e)
npm run quality:check

# Generate quality assurance report
npm run quality:report
```

## 🔧 Configuration

### Jest Configuration

The Jest configuration supports multiple test projects with different environments and timeouts:

- **Unit Tests**: Fast execution with mocked dependencies
- **Integration Tests**: Database integration with MongoDB service
- **AI Quality Tests**: OpenAI API integration for quality evaluation
- **Performance Tests**: Extended timeout for load testing

### Environment Variables

Required for testing:

```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/primr-faq-test
OPENAI_API_KEY=your-openai-api-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test-access-key
AWS_SECRET_ACCESS_KEY=test-secret-key
AWS_BUCKET_NAME=test-bucket
```

## 🧪 Testing Infrastructure

### Core Classes

- **TestSuiteManager**: Organizes and manages different test suites
- **QualityMetricsCollector**: Collects and analyzes AI quality metrics
- **PerformanceBenchmarkManager**: Tracks performance benchmarks and regressions
- **AIQualityEvaluator**: Automated AI response quality evaluation
- **PerformanceTester**: Load testing and performance analysis

### TypeScript Interfaces

- `TestSuite`: Test suite configuration and results
- `AIQualityTest`: AI quality test specifications
- `PerformanceBenchmark`: Performance metrics and thresholds
- `QualityMetric`: Quality measurement results
- `TestResult`: Individual test execution results

## 📊 Quality Gates

The framework enforces quality gates that must pass for deployment:

1. **Code Quality**: ESLint and TypeScript compilation
2. **Test Coverage**: Minimum 70% coverage across all metrics
3. **Unit Tests**: All unit tests must pass
4. **Integration Tests**: API and database integration validation
5. **Performance Tests**: Response time and throughput thresholds
6. **Security Tests**: Vulnerability scanning

## 🤖 AI Quality Validation

### Automated Evaluation Metrics

- **Accuracy**: Comparison with expected outputs using semantic similarity
- **Relevance**: Evaluation of response relevance to input questions
- **Coherence**: Assessment of response structure and readability
- **Responsiveness**: Response time efficiency measurement
- **Bias Detection**: Identification of problematic content in AI responses
- **Consistency**: Validation of consistent behavior across similar inputs

### Quality Test Configuration

```typescript
const qualityTest: AIQualityTest = {
  id: 'faq-quality-test',
  feature: 'faq-system',
  testCases: [
    {
      input: 'What time does the event start?',
      expectedOutput: 'The event starts at 7:00 PM.',
      evaluationCriteria: ['accuracy', 'relevance', 'coherence'],
      acceptanceThreshold: 0.8
    }
  ],
  qualityMetrics: {
    accuracy: 0,
    relevance: 0,
    coherence: 0,
    responsiveness: 0
  },
  lastEvaluation: new Date()
};
```

## 📈 Performance Testing

### Load Testing Scenarios

- **FAQ Endpoint**: Concurrent user simulation for Q&A interactions
- **File Upload**: Document processing performance under load
- **Chat History**: Retrieval performance testing

### Performance Thresholds

- **FAQ API**: < 5s response time, > 1 req/s throughput, < 5% error rate
- **Upload API**: < 30s response time, > 0.5 req/s throughput, < 5% error rate
- **Chat History**: < 2s response time, > 5 req/s throughput, < 2% error rate

## 🌐 End-to-End Testing

### User Workflows Tested

1. **Authentication Flow**: Sign-in/sign-out processes
2. **Event Management**: Create, select, and manage events
3. **Document Upload**: File upload and processing workflows
4. **FAQ Interaction**: Question asking and answer retrieval
5. **Chat History**: History viewing and management
6. **Responsive Design**: Mobile and tablet compatibility

### Cross-Browser Support

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: iOS Safari, Android Chrome
- **Responsive**: Various viewport sizes

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The testing pipeline includes:

1. **Quality Gates**: Code linting and TypeScript compilation
2. **Parallel Test Execution**: Unit, integration, and AI quality tests
3. **Performance Validation**: Load testing with regression detection
4. **E2E Testing**: Cross-browser validation
5. **Security Scanning**: Dependency and vulnerability checks
6. **Coverage Verification**: Minimum 70% coverage enforcement
7. **Deployment Readiness**: Quality gate validation for deployment

### Automated Reporting

- **Test Results**: Detailed test execution reports
- **Coverage Reports**: Line, function, branch, and statement coverage
- **Performance Metrics**: Response time and throughput analysis
- **Quality Metrics**: AI response quality assessment
- **Security Reports**: Vulnerability and dependency analysis

## 📋 Test Data Management

### Mock Data Generation

- **Events**: Test event creation with realistic data
- **Embeddings**: Mock document embeddings for testing
- **Chat History**: Generated conversation history
- **User Sessions**: Test user authentication simulation

### Fixtures and Utilities

- Test data generators for consistent test scenarios
- Mock API responses for external service dependencies
- Database seeding utilities for integration tests
- File upload simulation for testing document processing

## 🔍 Monitoring and Alerting

### Quality Metrics Tracking

- **Test Execution Time**: Performance trend monitoring
- **Coverage Trends**: Coverage improvement tracking
- **Failure Rates**: Test stability analysis
- **Performance Regressions**: Automated regression detection

### Alerting

- **Quality Gate Failures**: Immediate notification on CI/CD failures
- **Coverage Drops**: Alerts when coverage falls below thresholds
- **Performance Degradation**: Notification of response time increases
- **Security Vulnerabilities**: Immediate alerts for security issues

## 📚 Best Practices

### Writing Tests

1. **Descriptive Names**: Clear test descriptions that explain purpose
2. **Arrange-Act-Assert**: Structured test organization
3. **Independent Tests**: No dependencies between test cases
4. **Mock External Dependencies**: Consistent and reliable test execution
5. **Edge Case Coverage**: Test boundary conditions and error scenarios

### Maintaining Quality

1. **Regular Review**: Periodic assessment of test effectiveness
2. **Coverage Analysis**: Identify untested code paths
3. **Performance Monitoring**: Track response time trends
4. **AI Quality Tracking**: Monitor AI response quality over time
5. **Security Updates**: Regular dependency and vulnerability scanning

## 🔧 Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values for long-running tests
2. **MongoDB Connection**: Ensure MongoDB service is running for integration tests
3. **OpenAI API**: Verify API key configuration for AI quality tests
4. **Playwright Setup**: Run `npx playwright install` for E2E tests
5. **Coverage Thresholds**: Increase test coverage to meet 70% requirement

### Debug Mode

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test files
npm test tests/unit/infrastructure.spec.ts

# Enable debug logging
DEBUG=* npm test
```

## 📖 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

---

*This testing framework ensures the highest quality standards for the Primr FAQ Demo application with comprehensive coverage, automated quality validation, and continuous integration.*
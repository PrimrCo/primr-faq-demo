# Changelog

## [Unreleased]

### Added
- **Comprehensive Testing & Quality Assurance Framework:** Implemented a complete testing infrastructure with >90% code coverage requirement, automated quality validation, and continuous integration pipeline.
  - **Unit Tests:** Individual function and component testing for text extraction utilities and core components
  - **Integration Tests:** API endpoint testing with mocked dependencies for faq, upload, chat-history, and events endpoints
  - **AI Quality Tests:** Automated evaluation of AI response accuracy, relevance, coherence, and bias detection using OpenAI-powered quality metrics
  - **Performance Tests:** Load testing, stress testing, and performance regression detection for all critical endpoints
  - **End-to-End Tests:** Complete user workflow validation using Playwright for cross-browser testing
  - **Security Tests:** Vulnerability scanning and dependency security checks
  - **CI/CD Pipeline:** GitHub Actions workflow with quality gates that block deployment on test failures
  - **Quality Reporting:** Automated generation of comprehensive quality assurance reports with test results, coverage metrics, and performance benchmarks

- **Testing Infrastructure:**
  - TypeScript interfaces for TestSuite, AIQualityTest, PerformanceBenchmark, and QualityMetric
  - Test environment utilities for consistent test setup and teardown
  - Mock data generators for events, embeddings, and chat history
  - Coverage reporting with detailed metrics for lines, functions, branches, and statements
  - Performance monitoring with response time analysis and throughput measurement

- **AI Quality Validation System:**
  - Automated accuracy evaluation comparing actual vs expected AI responses
  - Relevance scoring to ensure responses address the input questions
  - Coherence assessment for response structure and readability
  - Bias detection to identify problematic content in AI-generated responses
  - Consistency testing across similar inputs to validate AI behavior
  - Response time monitoring for performance optimization

- **Event Grouping:** All documents, uploads, and Q&A are now grouped by event. Users can create, select, and manage events. All uploads, chat history, and answers are scoped to the selected event.
- **Extended File Type Support:** Added support for PDF (text extraction), CSV, and XLSX file parsing and embedding. Confirmed existing support for .md, .txt, and .docx files.
- **Environment Check Command:** Added `/ask-primr check-environment` command to verify required environment variables and print configuration status.

### Changed
- **Code Quality:** Fixed all ESLint errors and warnings to establish clean code baseline
- **Type Safety:** Improved TypeScript types throughout the application, eliminating `any` types and adding proper error handling
- **Testing Scripts:** Added comprehensive npm scripts for running different test categories and generating quality reports

### Testing Coverage
- **>90% Code Coverage:** Comprehensive test suite covering all AI features and integrations
- **Performance Benchmarks:** Established baseline metrics for all critical endpoints with regression detection
- **Quality Gates:** Automated checks that prevent deployment of code that doesn't meet quality standards
- **Cross-Browser Testing:** E2E tests running on Chrome, Firefox, Safari, and mobile browsers

---

Older changes can be listed below as needed.
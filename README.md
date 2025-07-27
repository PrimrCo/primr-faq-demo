# Primr FAQ Demo

A Next.js project for uploading, parsing, and querying FAQ documents using OpenAI embeddings and semantic search.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Development](#setup--development)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Usage](#usage)
  - [Uploading Documents](#uploading-documents)
  - [Asking Questions](#asking-questions)
- [API Reference](#api-reference)
  - [`POST /api/upload`](#post-apiupload)
  - [`POST /api/faq`](#post-apifaq)
- [Example UI Integration](#example-ui-integration)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Event Grouping](#event-grouping)
- [Commands](#commands)

---

## Features

- **Google Authentication** (NextAuth)
- **File Upload** to S3, organized per user
- **Document Parsing**: `.md`, `.txt`, `.pdf`, `.docx`, `.csv`, `.xlsx`
- **OpenAI Embeddings** for semantic search
- **MongoDB** for persistent embedding storage
- **Minimal UI** for upload and Q&A, with Primr branding

---

## Tech Stack

- Next.js 15 (App Router for UI, Pages Router for API)
- NextAuth.js (Google provider)
- AWS S3 (file storage)
- MongoDB (embedding storage)
- OpenAI Node SDK v4+
- Tailwind CSS (optional, for styling)

---

## Setup & Development

1. **Clone the repo:**
   ```sh
   git clone https://github.com/your-org/primr-faq-demo.git
   cd primr-faq-demo
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env.local` file in the project root:

   ```
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_S3_BUCKET=your-s3-bucket
   AWS_REGION=us-east-2

   OPENAI_API_KEY=sk-...

   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXTAUTH_SECRET=...

   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Add your logo:**

   Place your logo at:
   `public/images/logo-v1.jpg`

---

## Running the App

```sh
npm run dev
```

Visit [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## Testing

This project includes a comprehensive testing framework with multiple test types and quality assurance tools.

### Quick Start

**Prerequisites:**
- Node.js 18+
- MongoDB running locally (for integration tests)
- OpenAI API key (for AI quality tests)

**Installation:**
```sh
# Install test dependencies
npm install

# Install Playwright browsers for E2E tests
npx playwright install
```

### Running Tests

```sh
# Run all tests
npm test

# Run specific test categories
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests (requires MongoDB)
npm run test:ai-quality     # AI quality validation tests  
npm run test:performance    # Performance and load tests
npm run test:e2e            # End-to-end tests with Playwright

# Development & Debugging
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage reports
npm run test:ci             # CI mode with full reporting

# Quality Assurance
npm run quality:check       # Complete quality validation
npm run quality:report      # Generate comprehensive quality report
```

### Test Environment Setup

For testing, create a `.env.test` file or ensure these variables are set:

```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/primr-faq-test
OPENAI_API_KEY=your-openai-api-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test-access-key
AWS_SECRET_ACCESS_KEY=test-secret-key
AWS_BUCKET_NAME=test-bucket
```

### Test Types Included

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test API endpoints and database interactions
3. **AI Quality Tests** - Validate AI response accuracy and quality
4. **Performance Tests** - Load testing and performance validation
5. **E2E Tests** - Full user workflow testing across browsers

### Quality Requirements

- **Code Coverage**: Minimum 90% across lines, functions, branches, and statements
- **Performance**: Response times must meet defined thresholds
- **AI Quality**: Automated evaluation of response accuracy and relevance
- **Cross-Browser**: Testing on Chrome, Firefox, and Safari

For detailed testing documentation, see [TESTING.md](TESTING.md).

---

## Usage

### Uploading Documents

1. Sign in with Google.
2. Use the upload form to select a `.md`, `.txt`, `.pdf`, `.docx`, `.csv`, or `.xlsx` file.
3. Click "Upload".
4. The parsed text will be displayed after upload.

### Asking Questions

1. Enter your question in the "Ask a Question" form.
2. Click "Ask".
3. The answer, based on your uploaded documents, will be displayed.

---

## API Reference

### `POST /api/upload`

**Description:**
Upload a document for parsing, embedding, and storage.

**Auth:**
Google login required.

**Request:**
- `multipart/form-data` with a `file` field.

**Response:**
```json
{
  "success": true,
  "key": "user@email.com/filename.pdf",
  "parsedText": "Extracted text from your document..."
}
```

---

### `POST /api/faq`

**Description:**
Ask a question; get an answer based on your uploaded documents.

**Auth:**
Google login required.

**Request:**
```json
{
  "question": "What is the refund policy?"
}
```

**Response:**
```json
{
  "answer": "Our refund policy is..."
}
```

---

## Example UI Integration

Here’s how the UI interacts with the API (excerpt from [`app/page.tsx`](app/page.tsx)):

```tsx
const handleUpload = async () => {
  if (!file) return setMessage("Please select a file.");
  setUploading(true);
  setMessage("");
  setParsedText("");
  setAnswer("");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  setUploading(false);
  if (data.success) {
    setMessage("File uploaded and parsed successfully!");
    setParsedText(data.parsedText || "");
  } else {
    setMessage(data.error || "Upload failed.");
  }
};

const handleAsk = async () => {
  if (!question.trim()) return;
  setAsking(true);
  setAnswer("");
  const res = await fetch("/api/faq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  setAsking(false);
  setAnswer(data.answer || "No answer found.");
};
```

---

## FAQ

**Q: My OpenAI API key is not working!**
A: Make sure it is set in `.env.local` as `OPENAI_API_KEY=sk-...` and restart your dev server.

**Q: Why do I get "Unauthorized" errors?**
A: You must be signed in with Google to use the upload and FAQ endpoints.

**Q: Where are my files stored?**
A: Files are uploaded to your configured S3 bucket, organized by user email.

---

## Troubleshooting

- **Environment variables not loading:**
  - Ensure `.env.local` is in the project root.
  - Restart your dev server after editing `.env.local`.

- **API key errors:**
  - Never use `process.env.OPENAI_API_KEY` in client-side code.
  - Only use it in API routes.

- **S3 upload errors:**
  - Check your AWS credentials, bucket name, and permissions.

- **MongoDB errors:**
  - Ensure your `MONGODB_URI` is correct and the database is accessible.

---

## Event Grouping

- All uploaded documents and Q&A are grouped by "Event".
- You can create, select, and manage events from the UI.
- Uploaded files, chat history, and answers are always scoped to the currently selected event.
- This allows you to keep documents and conversations organized by project, meeting, or topic.

### How to Use Events

1. **Create or select an event** using the event selector in the UI.
2. **Upload documents** to the selected event.
3. **Ask questions** and view chat history, all scoped to the current event.
4. **Switch events** to see different sets of files and Q&A.

---

## Commands

### `/ask-primr check-environment`

Use this command to verify your environment configuration.
It checks for required environment variables and prints their status.

**Usage:**
```sh
npx ask-primr check-environment
```

**What it does:**
- Verifies all required environment variables are set.
- Prints a summary of your configuration.
- Helps debug setup issues before running the app.

---

**For further help, open an issue or contact the Primr support team.**

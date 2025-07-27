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

---

## 🧪 Complete Local Testing Guide for Beginners

**👋 New to testing? Follow this step-by-step guide to run tests on your computer.**

### Step 1: Check Your Computer Requirements

Before starting, make sure your computer has:
- **Node.js version 18 or higher** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) (we'll help you install this)

### Step 2: Get API Keys (Required for AI Tests)

You'll need an OpenAI API key:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new secret key
5. Copy it (it looks like: `sk-proj-abc123...`)

### Step 3: Install MongoDB Locally

**For Mac:**
```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**For Windows:**
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Follow the setup wizard
4. Start MongoDB as a service

**For Linux (Ubuntu):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

### Step 4: Clone and Setup the Project

```bash
# 1. Clone the repository (if you haven't already)
git clone https://github.com/PrimrCo/primr-faq-demo.git
cd primr-faq-demo

# 2. Install all dependencies
npm install

# 3. Install Playwright browsers for end-to-end tests
npx playwright install
```

### Step 5: Create Environment Files

Create a file called `.env.local` in the project root and add your API keys:

```bash
# Copy the example file first
cp .env.example .env.local
```

Then edit `.env.local` with your real values:
```bash
# OpenAI API Key (required for AI tests)
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here

# AWS Settings (can use test values)
AWS_ACCESS_KEY_ID=test-access-key
AWS_SECRET_ACCESS_KEY=test-secret-key
AWS_S3_BUCKET=test-bucket
AWS_REGION=us-east-1

# MongoDB (should work as-is if MongoDB is running locally)
MONGODB_URI=mongodb://localhost:27017/primr-faq-demo

# Google OAuth (not needed for tests)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
```

### Step 6: Verify Everything is Working

Run this command to check if everything is set up correctly:
```bash
npx ask-primr check-environment
```

You should see green checkmarks ✅ for most items.

### Step 7: Run Your First Test

Start with the simplest tests:

```bash
# Test just the basic functionality (fastest)
npm run test:unit
```

**What you should see:**
```
✅ PASS tests/unit/infrastructure.spec.ts
✅ PASS tests/unit/text-extraction.spec.ts
✅ Test Suites: 2 passed, 2 total
✅ Tests: 8 passed, 8 total
```

### Step 8: Run Different Types of Tests

Now try the other test types one by one:

```bash
# 1. Integration tests (tests API endpoints - requires MongoDB)
npm run test:integration

# 2. AI Quality tests (tests AI responses - requires OpenAI API key)
npm run test:ai-quality

# 3. Performance tests (tests speed and load)
npm run test:performance

# 4. End-to-end tests (tests the full app in a browser)
npm run test:e2e
```

### Step 9: Run All Tests with Coverage

```bash
# Run everything and see coverage report
npm run test:coverage
```

**What you should see:**
```
✅ All test suites passed
📊 Coverage Summary:
  Lines   : 92.5% (185/200)
  Functions: 91.2% (31/34)
  Branches: 89.7% (26/29)
  Statements: 92.1% (175/190)
```

### Step 10: Generate Quality Report

```bash
# Create a comprehensive quality report
npm run quality:report
```

This creates detailed reports in the `reports/` folder.

---

## 🔧 Troubleshooting Common Issues

### ❌ "MongoDB connection failed"
**Problem:** MongoDB isn't running
**Solution:** 
```bash
# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows - start MongoDB service from Services app
```

### ❌ "OpenAI API key invalid"
**Problem:** Wrong or missing API key
**Solution:** 
1. Check your `.env.local` file
2. Make sure the key starts with `sk-proj-` or `sk-`
3. Verify the key works at [OpenAI Platform](https://platform.openai.com/)

### ❌ "Cannot find module" errors
**Problem:** Missing dependencies
**Solution:** 
```bash
# Reinstall everything
rm -rf node_modules package-lock.json
npm install
npx playwright install
```

### ❌ Tests timing out
**Problem:** Tests taking too long
**Solution:** 
```bash
# Run tests one at a time instead of all together
npm run test:unit
# Wait for it to finish, then run:
npm run test:integration
```

### ❌ "Port already in use"
**Problem:** Another app is using the port
**Solution:** 
```bash
# Kill any running processes
pkill -f node
# Or restart your computer
```

---

## 📋 Quick Reference

### Test Commands
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only  
npm run test:integration   # Integration tests (needs MongoDB)
npm run test:ai-quality    # AI tests (needs OpenAI key)
npm run test:performance   # Performance tests
npm run test:e2e           # Browser tests
npm run test:coverage      # All tests + coverage report
npm run test:watch         # Run tests automatically when files change
npm run quality:check      # Complete quality validation
npm run quality:report     # Generate detailed reports
```

### What Each Test Type Does

1. **Unit Tests** (`npm run test:unit`)
   - Tests individual functions
   - Very fast (< 30 seconds)
   - Doesn't need external services

2. **Integration Tests** (`npm run test:integration`)
   - Tests API endpoints 
   - Needs MongoDB running
   - Takes 1-2 minutes

3. **AI Quality Tests** (`npm run test:ai-quality`)
   - Tests AI response quality
   - Needs OpenAI API key
   - Takes 2-3 minutes

4. **Performance Tests** (`npm run test:performance`)
   - Tests speed and load handling
   - Takes 3-5 minutes
   - Tests multiple users at once

5. **End-to-End Tests** (`npm run test:e2e`)
   - Tests the full app in real browsers
   - Takes 5-10 minutes
   - Tests clicking, typing, navigation

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

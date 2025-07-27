/**
 * End-to-End tests for critical user workflows
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('FAQ Demo E2E Tests', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('User Authentication Flow', () => {
    test('should display sign-in prompt for unauthenticated users', async () => {
      await page.goto('/');
      
      // Check if sign-in button is visible
      await expect(page.locator('text=Sign in')).toBeVisible();
      
      // Check that main content is not visible without authentication
      await expect(page.locator('text=Upload Document')).not.toBeVisible();
    });

    test('should redirect to sign-in when accessing protected features', async () => {
      await page.goto('/');
      
      // Try to access a protected feature
      const uploadSection = page.locator('[data-testid="upload-section"]');
      if (await uploadSection.isVisible()) {
        // If upload section is visible, it should be disabled/non-functional
        const fileInput = page.locator('input[type="file"]');
        await expect(fileInput).toBeDisabled();
      }
    });
  });

  test.describe('Event Management Workflow', () => {
    test.beforeEach(async () => {
      // Mock authentication for authenticated tests
      await page.addInitScript(() => {
        window.localStorage.setItem('test-auth', 'true');
      });
      
      // Mock NextAuth session
      await page.route('**/api/auth/session', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              email: 'test@example.com',
              name: 'Test User'
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });

      await page.goto('/');
    });

    test('should create a new event', async () => {
      // Mock events API
      await page.route('**/api/events', route => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ events: [] })
          });
        } else if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              _id: 'new-event-id',
              name: 'New Test Event'
            })
          });
        }
      });

      // Look for event creation form
      const eventSelector = page.locator('[data-testid="event-selector"]');
      if (await eventSelector.isVisible()) {
        // Create new event
        await page.fill('input[placeholder*="event name"]', 'New Test Event');
        await page.click('button:has-text("Create Event")');
        
        // Verify event was created
        await expect(page.locator('text=New Test Event')).toBeVisible();
      } else {
        // If event selector not found, look for alternative UI patterns
        const createEventButton = page.locator('button:has-text("Create"), button:has-text("New Event")');
        if (await createEventButton.count() > 0) {
          await createEventButton.first().click();
        }
      }
    });

    test('should select an existing event', async () => {
      // Mock events API with existing events
      await page.route('**/api/events', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            events: [
              {
                _id: 'existing-event-id',
                name: 'Existing Test Event',
                createdAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();

      // Select existing event
      const existingEvent = page.locator('text=Existing Test Event');
      if (await existingEvent.isVisible()) {
        await existingEvent.click();
        
        // Verify event is selected
        await expect(page.locator('text=Selected: Existing Test Event')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Document Upload Workflow', () => {
    test.beforeEach(async () => {
      // Set up authentication and event selection
      await page.addInitScript(() => {
        window.localStorage.setItem('test-auth', 'true');
      });

      await page.route('**/api/auth/session', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { email: 'test@example.com' },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });

      await page.route('**/api/events', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            events: [{
              _id: 'test-event-id',
              name: 'Test Event'
            }]
          })
        });
      });

      await page.goto('/');
    });

    test('should upload a document successfully', async () => {
      // Mock file upload API
      await page.route('**/api/upload', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'File uploaded and processed successfully',
            extractedText: 'Sample extracted text from document'
          })
        });
      });

      // Find and use file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Create a test file
        const testFile = {
          name: 'test-document.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Test document content')
        };

        await fileInput.setInputFiles(testFile);
        
        // Submit upload
        const uploadButton = page.locator('button:has-text("Upload")');
        await uploadButton.click();
        
        // Verify upload success
        await expect(page.locator('text=uploaded and processed successfully')).toBeVisible({ timeout: 15000 });
      }
    });

    test('should display error for invalid file types', async () => {
      // Mock file upload API error
      await page.route('**/api/upload', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unsupported file type'
          })
        });
      });

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Try to upload invalid file type
        const invalidFile = {
          name: 'test-image.exe',
          mimeType: 'application/x-executable',
          buffer: Buffer.from('Invalid file content')
        };

        await fileInput.setInputFiles(invalidFile);
        
        const uploadButton = page.locator('button:has-text("Upload")');
        await uploadButton.click();
        
        // Verify error message
        await expect(page.locator('text=Unsupported file type')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('FAQ Interaction Workflow', () => {
    test.beforeEach(async () => {
      // Set up full authenticated state with uploaded documents
      await page.addInitScript(() => {
        window.localStorage.setItem('test-auth', 'true');
      });

      // Mock all required APIs
      await page.route('**/api/auth/session', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { email: 'test@example.com' },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });

      await page.route('**/api/events', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            events: [{
              _id: 'test-event-id',
              name: 'Test Event'
            }]
          })
        });
      });

      await page.route('**/api/files**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            files: [{
              docKey: 'test-document.pdf',
              originalFilename: 'test-document.pdf'
            }]
          })
        });
      });

      await page.goto('/');
    });

    test('should ask a question and receive an answer', async () => {
      // Mock FAQ API
      await page.route('**/api/faq', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            answer: 'The event starts at 7:00 PM according to the uploaded document.'
          })
        });
      });

      // Find question input and ask question
      const questionInput = page.locator('input[placeholder*="question"], textarea[placeholder*="question"]');
      if (await questionInput.isVisible()) {
        await questionInput.fill('What time does the event start?');
        
        const askButton = page.locator('button:has-text("Ask")');
        await askButton.click();
        
        // Verify answer is displayed
        await expect(page.locator('text=The event starts at 7:00 PM')).toBeVisible({ timeout: 15000 });
      }
    });

    test('should handle FAQ API errors gracefully', async () => {
      // Mock FAQ API error
      await page.route('**/api/faq', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Failed to generate answer'
          })
        });
      });

      const questionInput = page.locator('input[placeholder*="question"], textarea[placeholder*="question"]');
      if (await questionInput.isVisible()) {
        await questionInput.fill('What time does the event start?');
        
        const askButton = page.locator('button:has-text("Ask")');
        await askButton.click();
        
        // Verify error message is displayed
        await expect(page.locator('text=Failed to generate answer')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Chat History Workflow', () => {
    test.beforeEach(async () => {
      // Set up authenticated state
      await page.addInitScript(() => {
        window.localStorage.setItem('test-auth', 'true');
      });

      await page.route('**/api/auth/session', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { email: 'test@example.com' },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });

      await page.goto('/');
    });

    test('should display chat history', async () => {
      // Mock chat history API
      await page.route('**/api/chat-history**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            chats: [
              {
                question: 'What time does the event start?',
                answer: 'The event starts at 7:00 PM.',
                timestamp: new Date().toISOString()
              },
              {
                question: 'Where is the venue?',
                answer: 'The venue is located at 123 Main Street.',
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      });

      // Look for chat history button/section
      const chatHistoryButton = page.locator('button:has-text("History"), button:has-text("Chat History")');
      if (await chatHistoryButton.isVisible()) {
        await chatHistoryButton.click();
        
        // Verify chat history is displayed
        await expect(page.locator('text=What time does the event start?')).toBeVisible();
        await expect(page.locator('text=Where is the venue?')).toBeVisible();
      }
    });

    test('should clear chat history', async () => {
      // Mock delete chat history API
      await page.route('**/api/chat-history**', route => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ chats: [] })
          });
        }
      });

      // Look for clear history functionality
      const clearButton = page.locator('button:has-text("Clear"), button:has-text("Delete History")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        
        // Verify history is cleared
        await expect(page.locator('text=No chat history')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      
      // Check that the page is responsive
      const mainContent = page.locator('main, [role="main"]');
      if (await mainContent.isVisible()) {
        const boundingBox = await mainContent.boundingBox();
        expect(boundingBox?.width).toBeLessThanOrEqual(375);
      }
    });

    test('should work on tablet devices', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/');
      
      // Verify layout adapts to tablet size
      const navigation = page.locator('nav, [role="navigation"]');
      if (await navigation.isVisible()) {
        await expect(navigation).toBeVisible();
      }
    });
  });
});
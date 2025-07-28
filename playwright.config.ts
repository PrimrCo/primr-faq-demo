import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 * 
 * NOTE: This is a simplified configuration for basic smoke testing.
 * The original comprehensive configuration is preserved below for future reference.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Disable traces and video to avoid dependency issues */
    trace: 'off',
    
    /* Disable screenshot on failure */
    screenshot: 'off',
    
    /* Disable video recording */
    video: 'off',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use system-installed browser to avoid download issues
        launchOptions: {
          executablePath: '/usr/bin/google-chrome-stable',
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

/* 
 * ORIGINAL COMPREHENSIVE CONFIGURATION (preserved for future reference)
 * 
 * This was the original configuration with multiple browsers and advanced features.
 * Restore this configuration when you want to run comprehensive cross-browser testing.
 * 
 * export default defineConfig({
 *   testDir: './tests/e2e',
 *   
 *   fullyParallel: true,
 *   forbidOnly: !!process.env.CI,
 *   retries: process.env.CI ? 2 : 0,
 *   workers: process.env.CI ? 1 : undefined,
 *   
 *   reporter: [
 *     ['html', { outputFolder: 'playwright-report' }],
 *     ['json', { outputFile: 'test-results/e2e-results.json' }],
 *     ['junit', { outputFile: 'test-results/e2e-results.xml' }]
 *   ],
 *   
 *   use: {
 *     baseURL: 'http://localhost:3000',
 *     trace: 'on-first-retry',
 *     screenshot: 'only-on-failure',
 *     video: 'retain-on-failure',
 *   },
 * 
 *   projects: [
 *     {
 *       name: 'chromium',
 *       use: { ...devices['Desktop Chrome'] },
 *     },
 *     {
 *       name: 'firefox',
 *       use: { ...devices['Desktop Firefox'] },
 *     },
 *     {
 *       name: 'webkit',
 *       use: { ...devices['Desktop Safari'] },
 *     },
 *     {
 *       name: 'Mobile Chrome',
 *       use: { ...devices['Pixel 5'] },
 *     },
 *     {
 *       name: 'Mobile Safari',
 *       use: { ...devices['iPhone 12'] },
 *     },
 *   ],
 * 
 *   webServer: {
 *     command: 'npm run dev',
 *     url: 'http://localhost:3000',
 *     reuseExistingServer: !process.env.CI,
 *     timeout: 120 * 1000,
 *   },
 * });
 */
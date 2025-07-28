/**
 * Simplified End-to-End test for basic functionality
 */

import { test, expect } from '@playwright/test';

test.describe('FAQ Demo Basic E2E Test', () => {
  test('should load the homepage and display basic UI elements', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/Primr Event Manager/);
    
    // Check for key UI elements that should be present
    // This is a basic smoke test to ensure the app loads
    await expect(page.locator('body')).toBeVisible();
    
    // Just verify the page content is not empty
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
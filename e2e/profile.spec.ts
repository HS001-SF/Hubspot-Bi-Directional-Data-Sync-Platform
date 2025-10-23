import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');

    // Navigate to profile
    await page.goto('/profile');
  });

  test('should display profile page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Profile');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should display current user information', async ({ page }) => {
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');

    await expect(nameInput).not.toHaveValue('');
    await expect(emailInput).not.toHaveValue('');
  });

  test('should update profile name', async ({ page }) => {
    const newName = `Updated Name ${Date.now()}`;

    await page.fill('input[name="name"]', newName);
    await page.click('button:has-text("Save Changes")');

    // Wait for success toast
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Verify name updated in navigation
    await page.reload();
    await expect(page.locator(`text=${newName}`)).toBeVisible();
  });

  test('should show error when updating with invalid email', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should show error when email already exists', async ({ page }) => {
    // Try to update to an existing email
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Email already in use')).toBeVisible();
  });

  test('should upload avatar image', async ({ page }) => {
    // Create a test image file path
    const testImagePath = path.join(__dirname, 'fixtures', 'test-avatar.jpg');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Should show preview
    await expect(page.locator('img[alt="Avatar preview"]')).toBeVisible();

    // Click save avatar
    await page.click('button:has-text("Save Avatar")');

    // Wait for success toast
    await expect(page.locator('text=Avatar updated successfully')).toBeVisible();

    // Verify avatar appears in navigation
    await page.reload();
    const avatar = page.locator('[data-testid="user-avatar"] img');
    await expect(avatar).toBeVisible();
  });

  test('should remove avatar image', async ({ page }) => {
    // Upload an avatar first
    const testImagePath = path.join(__dirname, 'fixtures', 'test-avatar.jpg');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await page.click('button:has-text("Save Avatar")');

    await expect(page.locator('text=Avatar updated successfully')).toBeVisible();

    // Now remove it
    await page.click('button:has-text("Remove Avatar")');

    // Wait for success toast
    await expect(page.locator('text=Avatar removed successfully')).toBeVisible();

    // Verify avatar is gone (should show initials)
    await page.reload();
    const avatarFallback = page.locator('[data-testid="user-avatar"]');
    await expect(avatarFallback).toContainText(/[A-Z]{1,2}/); // Initials
  });

  test('should show error for invalid image file type', async ({ page }) => {
    // Try to upload a non-image file
    const testFilePath = path.join(__dirname, 'fixtures', 'test-document.pdf');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Save Avatar")');

    await expect(page.locator('text=File must be an image')).toBeVisible();
  });

  test('should show error for image file too large', async ({ page }) => {
    // This would need a large test image file
    const largeImagePath = path.join(__dirname, 'fixtures', 'large-image.jpg');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largeImagePath);

    await page.click('button:has-text("Save Avatar")');

    await expect(page.locator('text=File too large')).toBeVisible();
  });

  test('should cancel avatar upload', async ({ page }) => {
    const testImagePath = path.join(__dirname, 'fixtures', 'test-avatar.jpg');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Should show preview
    await expect(page.locator('img[alt="Avatar preview"]')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Preview should be gone
    await expect(page.locator('img[alt="Avatar preview"]')).not.toBeVisible();
  });

  test('should validate all fields before saving', async ({ page }) => {
    // Clear name
    await page.fill('input[name="name"]', '');

    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Name is required')).toBeVisible();
  });
});

test.describe('Profile Avatar in Navigation', () => {
  test('should display avatar across all pages', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Upload avatar
    await page.goto('/profile');
    const testImagePath = path.join(__dirname, 'fixtures', 'test-avatar.jpg');
    await page.locator('input[type="file"]').setInputFiles(testImagePath);
    await page.click('button:has-text("Save Avatar")');

    await expect(page.locator('text=Avatar updated successfully')).toBeVisible();

    // Check avatar on different pages
    const pages = ['/', '/sync-configs', '/jobs', '/settings'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      const avatar = page.locator('[data-testid="user-avatar"] img');
      await expect(avatar).toBeVisible();
    }
  });
});

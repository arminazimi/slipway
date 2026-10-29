import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  testDir: './',
  testMatch: '**/*.test.mjs',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-light',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light'
      },
    },
    {
      name: 'chromium-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark'
      },
    },
    {
      name: 'chromium-rtl',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light'
      },
    }
  ],
});

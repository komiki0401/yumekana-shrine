import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// Dedicated build with a fake API URL. Every request is intercepted by tests.
export default defineConfig({
  ...base,
  testDir: './e2e-ai',
  outputDir: './test-results-ai',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4174/yumekana-shrine/' },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/yumekana-shrine/',
    env: { VITE_YOSHUKU_API_URL: 'https://yoshuku.example.test/api/yoshuku' },
    reuseExistingServer: false,
  },
})

import { defineConfig } from 'cypress'
import pkg from 'cy-verify-downloads';
const { verifyDownloadTasks } = pkg;

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', verifyDownloadTasks)
    },
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4173'
  }
})

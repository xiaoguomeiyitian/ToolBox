import { defineConfig } from 'vitest/config';
import * as dotenv from 'dotenv';

dotenv.config({ path: './test/.env.test' });

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});

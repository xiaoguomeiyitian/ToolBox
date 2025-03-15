# Vitest Testing Guide

## Configuration

The project uses Vitest as its testing framework, configured in `vitest.config.ts`:
- Test files are located in `test/**/*.test.ts`
- The testing environment is Node.js
- Loads `./test/.env.test` environment variables

## Writing Test Cases

Basic structure:
```typescript
import { describe, test, expect } from 'vitest';

describe('Test Suite Name', () => {
  test('Test Case Name', async () => {
    const result = await someFunction();
    expect(result).toContain("Expected Result");
  });
});
```

## Example (time_tool.test.ts)

```typescript
import { schema as toolSchema, default as toolHandler } from '../../src/tools/time_tool';
import { describe, test, expect } from 'vitest';

describe('time_tool Test Suite', () => {
  test('Basic Test', async () => {
    const result = await toolHandler({ params: { arguments: {} } });
    expect(result.content[0].text).toContain("Current time:");
  });

  test('format Parameter Test', async () => {
    const result = await toolHandler({ params: { arguments: { format: 'iso' } } });
    expect(result.content[0].text).toContain("Current time:");
  });
});
```

## Running Tests

Run all tests:
```bash
npm test
```

Run a single file:
```bash
npx vitest run test/tools/time_tool.test.ts
```

Run a specific test:
```bash
npx vitest run -t "Basic Test"
```

Watch mode:
```bash
npx vitest watch

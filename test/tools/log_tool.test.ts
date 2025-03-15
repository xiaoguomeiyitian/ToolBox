import { schema as toolSchema, default as toolHandler } from '../../src/tools/log_tool';
import { describe, test, expect } from 'vitest';

describe('log_tool 测试套件', () => {
  test('基本测试', async () => {
    const result = await toolHandler({ params: { arguments: { pageSize: 1, page: 1 } } });
    expect(result.isError).toBe(undefined);
  });

  test('toolName 过滤', async () => {
    const result = await toolHandler({ params: { arguments: { pageSize: 1, page: 1, toolName: 'time_tool' } } });
    expect(result.isError).toBe(undefined);
  });

  test('status 过滤', async () => {
    const result = await toolHandler({ params: { arguments: { pageSize: 1, page: 1, status: 'success' } } });
    expect(result.isError).toBe(undefined);
  });

  test('minDuration 过滤', async () => {
    const result = await toolHandler({ params: { arguments: { pageSize: 1, page: 1, minDuration: 10 } } });
    expect(result.isError).toBe(undefined);
  });

  test('maxDuration 过滤', async () => {
    const result = await toolHandler({ params: { arguments: { pageSize: 1, page: 1, maxDuration: 10 } } });
    expect(result.isError).toBe(undefined);
  });

  test('startTime 过滤', async () => {
    const result = await toolHandler({ params: { arguments: { pageSize: 1, page: 1, startTime: '2024-01-01T00:00:00.000Z' } } });
    expect(result.isError).toBe(undefined);
  });

  test('endTime 过滤', async () => {
    const result = await toolHandler({ params: { arguments: { pageSize: 1, page: 1, endTime: '2024-01-01T00:00:00.000Z' } } });
    expect(result.isError).toBe(undefined);
  });
});

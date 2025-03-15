import { schema as toolSchema, default as toolHandler } from '../../src/tools/redis_tool';
import { describe, test, expect, vi } from 'vitest';
import { Redis } from 'ioredis';

// Mock Redis dependencies
vi.mock('ioredis', async () => {
  const actual = await import('ioredis');
  const mockRedis = {
    call: vi.fn().mockResolvedValue('OK'),
  };

  return {
    ...actual,
    Redis: vi.fn().mockReturnValue(mockRedis),
  };
});

describe('redis_tool 测试套件', () => {
  test('set 命令测试', async () => {
    const result = await toolHandler({ params: { arguments: { command: 'set', args: '["test", "test"]' } } });
    expect(JSON.parse(result.content[0].text)).toEqual('OK');
  });

  test('get 命令测试', async () => {
    const result = await toolHandler({ params: { arguments: { command: 'get', args: '["test"]' } } });
    expect(JSON.parse(result.content[0].text)).toEqual('OK');
  });

  test('del 命令测试', async () => {
    const result = await toolHandler({ params: { arguments: { command: 'del', args: '["test"]' } } });
    expect(JSON.parse(result.content[0].text)).toEqual('OK');
  });
});

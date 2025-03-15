import { schema as toolSchema, default as toolHandler } from '../../src/tools/time_tool';
import { describe, test, expect } from 'vitest';

describe('time_tool 测试套件', () => {
  test('参数验证', async () => {
    // 测试必填参数缺失场景
    const result = await toolHandler({ params: { arguments: {} } });
    expect(result.content[0].text).toContain("Current time:");
  });

  test('format 参数测试', async () => {
    // 测试 format 参数为 iso
    const result = await toolHandler({ params: { arguments: { format: 'iso' } } });
    expect(result.content[0].text).toContain("Current time:");
  });

  test('timezone 参数测试', async () => {
    // 测试 timezone 参数为 Asia/Shanghai
    const result = await toolHandler({ params: { arguments: { timezone: 'Asia/Shanghai' } } });
    expect(result.content[0].text).toContain("Current time:");
  });
});

import { default as toolHandler } from '../../src/tools/schedule_tool';
import { describe, test, expect, vi } from 'vitest';

describe('schedule_tool 测试套件', () => {
  test('创建任务测试', async () => {
    const mockCreateTask = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Task created successfully' }] });
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn() as any;

    const result = await toolHandler({ params: { arguments: { action: 'create', time: '2025-03-16 00:00:00', toolName: 'time_tool', toolArgs: {} } } });
    expect(result.content[0].text).toContain("Scheduled task created. ID:");
    global.setTimeout = originalSetTimeout;
  });

  test('取消任务测试', async () => {
    const mockCancelTask = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Task canceled. ID: 123' }] });
    const result = await toolHandler({ params: { arguments: { action: 'cancel', id: '123' } } });
    expect(result.content[0].text).toContain("Task canceled. ID:");
  });

  test('列出任务测试', async () => {
    const mockListTasks = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '[{"id": "d024bd6b-be88-41dd-8bb0-5a19e21fdcc0","toolName": "time_tool","toolArgs": {},"executed": false,"creationTime": "2025-03-15T11:27:09.160Z","type": "once_absolute","time": "2025-03-16 00:00:00"}]' }] });
    const result = await toolHandler({ params: { arguments: { action: 'list' } } });
    expect(result.content[0].text).toContain("[");
  });
});

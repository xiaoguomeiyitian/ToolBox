import { schema as toolSchema, default as toolHandler } from '../../src/tools/create_note';
import { describe, test, expect } from 'vitest';

describe('create_note 测试套件', () => {
  test('基本测试', async () => {
    const result = await toolHandler({ params: { arguments: { title: '测试标题', content: '测试内容' } } });
    expect(result.content[0].text).toContain("Created note 1: 测试标题");
  });

  test('标题或内容为空时', async () => {
    // 标题为空
    const result1 = await toolHandler({ params: { arguments: { title: '', content: '测试内容' } } });
    expect(result1.content[0].text).toContain("Error creating note: Title and content are required");

    // 内容为空
    const result2 = await toolHandler({ params: { arguments: { title: '测试标题', content: '' } } });
    expect(result2.content[0].text).toContain("Error creating note: Title and content are required");
  });
});

import { schema as toolSchema, default as toolHandler } from '../../src/tools/mongo_tool';
import { describe, test, expect, vi } from 'vitest';

// Mock MongoDB dependencies
vi.mock('mongodb', async () => {
  const actual = await import('mongodb');
  const mockCollection = {
    find: vi.fn().mockReturnValue({
      stream: vi.fn().mockReturnThis(),
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback({ name: 'test' });
        } else if (event === 'end') {
          callback();
        }
        return mockCollection;
      }),
      toArray: vi.fn().mockResolvedValue([{ name: 'test' }]),
    }),
    countDocuments: vi.fn().mockResolvedValue(1),
    distinct: vi.fn().mockResolvedValue(['test']),
    insertOne: vi.fn().mockResolvedValue({ insertedId: 'test' }),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    insertMany: vi.fn().mockResolvedValue({ insertedIds: ['test'] }),
    updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    createIndex: vi.fn().mockResolvedValue('indexName'),
    dropIndex: vi.fn().mockResolvedValue(undefined),
    listIndexes: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([{ name: 'testIndex' }]) }),
    stream: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  };

  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };

  const mockMongoClient = {
    db: vi.fn().mockReturnValue(mockDb),
  };

  return {
    ...actual,
    MongoClient: {
      connect: vi.fn().mockResolvedValue(mockMongoClient),
    },
  };
});

describe('mongo_tool 测试套件', () => {
  test('find 查询测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test' } } });
    expect(JSON.parse(result.content[0].text)).toEqual([{ name: 'test' }]);
  });

  test('count 查询测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', queryType: 'count' } } });
    expect(JSON.parse(result.content[0].text)).toEqual(1);
  });

  test('distinct 查询测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"field": "name"}', dbName: 'test', collectionName: 'test', queryType: 'distinct' } } });
    expect(JSON.parse(result.content[0].text)).toEqual(['test']);
  });

  test('insertOne 插入测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', queryType: 'insertOne', data: '{"name": "test"}' } } });
    expect(JSON.parse(result.content[0].text)).toEqual({ insertedId: 'test' });
  });

    test('updateOne 更新测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', queryType: 'updateOne', updateOperators: '{"$set": {"name": "test2"}}' } } });
    expect(JSON.parse(result.content[0].text)).toEqual({ modifiedCount: 1 });
  });

  test('deleteOne 删除测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', queryType: 'deleteOne' } } });
    expect(JSON.parse(result.content[0].text)).toEqual({ deletedCount: 1 });
  });

  test('insertMany 插入多个测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', queryType: 'insertMany', data: '[{"name": "test"}]' } } });
    expect(JSON.parse(result.content[0].text)).toEqual({ insertedIds: ['test'] });
  });

  test('updateMany 更新多个测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', queryType: 'updateMany', updateOperators: '{"$set": {"name": "test2"}}' } } });
    expect(JSON.parse(result.content[0].text)).toEqual({ modifiedCount: 1 });
  });

  test('deleteMany 删除多个测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', queryType: 'deleteMany' } } });
    expect(JSON.parse(result.content[0].text)).toEqual({ deletedCount: 1 });
  });

  test('createIndex 创建索引测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', operationType: 'createIndex', indexes: '{"name": 1}' } } });
    expect(JSON.parse(result.content[0].text)).toEqual('indexName');
  });

  test('dropIndex 删除索引测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', operationType: 'dropIndex', indexes: '{"name": 1}' } } });
    expect(result.content[0].text).toEqual(JSON.stringify(undefined));
  });

  test('listIndexes 列出索引测试', async () => {
    const result = await toolHandler({ params: { arguments: { where: '{"name": "test"}', dbName: 'test', collectionName: 'test', operationType: 'listIndexes' } } });
    expect(JSON.parse(result.content[0].text)).toEqual([{ name: 'testIndex' }]);
  });
});

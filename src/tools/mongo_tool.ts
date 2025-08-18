import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) { 
    console.warn("警告: 环境变量 MONGO_URI 未设置，mongo_tool 将不可用。"); 
}

/** mongo_tool 工具的参数列表 */
export const schema = {
    name: "mongo_tool",
    description: "功能全面的MongoDB工具，支持CRUD查询、聚合、索引和集合管理。",
    type: "object",
    properties: {
        dbName: {
            type: "string",
            description: "MongoDB 数据库名称",
        },
        collectionName: {
            type: "string",
            description: "MongoDB 集合名称",
        },
        queryType: {
            type: "string",
            description: "MongoDB 查询类型",
            enum: [
                "find", "findOne", "aggregate", "count", "distinct",
                "insertOne", "updateOne", "deleteOne", "insertMany", "updateMany", "deleteMany",
                "bulkWrite", "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace"
            ]
        },
        operationType: {
            type: "string",
            enum: [
                "createIndex", "dropIndex", "listIndexes", "listCollections",
                "createCollection", "dropCollection", "renameCollection", "collStats", "dbStats"
            ],
            description: "数据库管理操作类型 (索引/集合管理)"
        },
        where: {
            type: "object",
            description: "查询条件 (BSON/JSON 对象)",
        },
        data: {
            type: ["object", "array"],
            description: "用于插入或替换的数据 (单个对象或对象数组)",
        },
        updateOperators: {
            type: "object",
            description: "更新操作符 (例如: { $set: { field: 'value' } })",
        },
        pipeline: {
            type: "array",
            description: "聚合管道阶段 (对象数组)"
        },
        field: {
            type: "string",
            description: "用于 distinct 操作的字段名",
        },
        indexes: {
            type: "object",
            description: "索引规范 (例如: { field: 1 })"
        },
        newName: {
            type: "string",
            description: "用于 renameCollection 的新名称"
        },
        bulkOperations: {
            type: "array",
            description: "批量写入操作数组"
        },
        options: {
            type: "object",
            description: "其他选项 (例如: { sort: { field: -1 }, limit: 10 })",
        }
    },
    required: ["dbName"]
};

async function getClient(): Promise<MongoClient> {
    if (!mongoUri) {
        throw new Error("环境变量 MONGO_URI 未设置，无法连接到 MongoDB。");
    }
    const client = new MongoClient(mongoUri, {
        maxPoolSize: 5,
        maxIdleTimeMS: 60000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000
    });
    await client.connect();
    return client;
}

export default async (request: any) => {
    let client: MongoClient | null = null;
    try {
        const args = request.params.arguments || {};
        const { 
            dbName, collectionName, queryType, operationType, 
            where = {}, data, updateOperators, pipeline, field, 
            indexes, newName, bulkOperations, options = {} 
        } = args;

        if (!operationType && !queryType) {
            throw new Error("必须提供 'operationType' 或 'queryType' 参数之一。");
        }
        if (operationType && queryType) {
            throw new Error("'operationType' 和 'queryType' 参数不能同时提供。");
        }

        client = await getClient();
        const db: Db = client.db(dbName);
        const collection = collectionName ? db.collection(collectionName) : null;

        let results: any;

        if (operationType) {
            switch (operationType) {
                case "createIndex":
                    if (!collection) throw new Error("创建索引需要 'collectionName'。");
                    if (!indexes) throw new Error("创建索引需要 'indexes' 对象。");
                    results = await collection.createIndex(indexes, options);
                    break;
                case "dropIndex":
                    if (!collection) throw new Error("删除索引需要 'collectionName'。");
                    if (!indexes) throw new Error("删除索引需要 'indexes' 对象或索引名称字符串。");
                    results = await collection.dropIndex(indexes, options);
                    break;
                case "listIndexes":
                    if (!collection) throw new Error("列出索引需要 'collectionName'。");
                    results = await collection.listIndexes().toArray();
                    break;
                case "listCollections":
                    results = await db.listCollections(where, options).toArray();
                    break;
                case "createCollection":
                    if (!collectionName) throw new Error("创建集合需要 'collectionName'。");
                    await db.createCollection(collectionName, options);
                    results = { success: true, message: `集合 '${collectionName}' 创建成功。` };
                    break;
                case "dropCollection":
                    if (!collectionName) throw new Error("删除集合需要 'collectionName'。");
                    results = await db.dropCollection(collectionName);
                    break;
                case "renameCollection":
                    if (!collection) throw new Error("重命名集合需要 'collectionName'。");
                    if (!newName) throw new Error("重命名集合需要 'newName'。");
                    await collection.rename(newName, options);
                    results = { success: true, message: `集合 '${collectionName}' 已成功重命名为 '${newName}'。` };
                    break;
                case "collStats":
                    if (!collectionName) throw new Error("获取集合状态需要 'collectionName'。");
                    results = await db.command({ collStats: collectionName });
                    break;
                case "dbStats":
                    results = await db.command({ dbStats: 1 });
                    break;
                default:
                    throw new Error(`不支持的操作类型: ${operationType}`);
            }
        } else {
            if (!collection) throw new Error("查询操作需要 'collectionName'。");

            switch (queryType) {
                case "find":
                    results = await collection.find(where, options).toArray();
                    break;
                case "findOne":
                    results = await collection.findOne(where, options);
                    break;
                case "aggregate":
                    if (!pipeline) throw new Error("聚合操作需要 'pipeline' 数组。");
                    results = await collection.aggregate(pipeline, options).toArray();
                    break;
                case "count":
                    results = await collection.countDocuments(where, options);
                    break;
                case "distinct":
                    if (!field) throw new Error("Distinct 操作需要 'field' 字段名。");
                    results = await collection.distinct(field, where, options);
                    break;
                case "insertOne":
                    if (!data) throw new Error("插入单条数据需要 'data' 对象。");
                    results = await collection.insertOne(data, options);
                    break;
                case "updateOne":
                    if (!updateOperators) throw new Error("更新单条数据需要 'updateOperators' 对象。");
                    results = await collection.updateOne(where, updateOperators, options);
                    break;
                case "deleteOne":
                    results = await collection.deleteOne(where, options);
                    break;
                case "insertMany":
                    if (!Array.isArray(data)) throw new Error("插入多条数据需要 'data' 数组。");
                    results = await collection.insertMany(data, options);
                    break;
                case "updateMany":
                    if (!updateOperators) throw new Error("更新多条数据需要 'updateOperators' 对象。");
                    results = await collection.updateMany(where, updateOperators, options);
                    break;
                case "deleteMany":
                    results = await collection.deleteMany(where, options);
                    break;
                case "bulkWrite":
                    if (!Array.isArray(bulkOperations)) throw new Error("批量写入需要 'bulkOperations' 数组。");
                    results = await collection.bulkWrite(bulkOperations, options);
                    break;
                case "findOneAndUpdate":
                    if (!updateOperators) throw new Error("查找并更新需要 'updateOperators' 对象。");
                    results = await collection.findOneAndUpdate(where, updateOperators, options);
                    break;
                case "findOneAndDelete":
                    results = await collection.findOneAndDelete(where, options);
                    break;
                case "findOneAndReplace":
                    if (!data) throw new Error("查找并替换需要 'data' 对象。");
                    results = await collection.findOneAndReplace(where, data, options);
                    break;
                default:
                    throw new Error(`不支持的查询类型: ${queryType}`);
            }
        }

        return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true,
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};

export async function destroy() {
    // No persistent client to destroy, so this function is intentionally empty.
    console.log("Destroy mongo_tool");
}

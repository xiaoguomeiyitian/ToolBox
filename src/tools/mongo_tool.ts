import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI environment variable is not set.");
const mongoClient = await MongoClient.connect(mongoUri, {
    maxPoolSize: 5,
    maxIdleTimeMS: 60 * 1000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
});

/** mongo_tool 工具的参数列表 */
export const schema = {
    name: "mongo_tool",
    description: "Comprehensive MongoDB operations tool supporting queries, aggregations, CRUD operations, and index management",
    type: "object",
    properties: {
        where: {
            type: "string",
            description: "Query condition in JSON string format. Example: {\"age\": {\"$gt\": 18}} to find users older than 18.",
        },
        dbName: {
            type: "string",
            description: "The name of the MongoDB database to query.",
        },
        collectionName: {
            type: "string",
            description: "The name of the MongoDB collection to query.",
        },
        field: {
            type: "string",
            description: "Field name for distinct operation.",
        },
        queryType: {
            type: "string",
            description: "The type of MongoDB query to execute.",
            enum: [
                "find",
                "findOne",
                "aggregate",
                "count",
                "distinct",
                "insertOne",
                "updateOne",
                "deleteOne",
                "insertMany",
                "updateMany",
                "deleteMany",
                "bulkWrite",
                "estimatedDocumentCount",
                "findOneAndUpdate",
                "findOneAndDelete",
                "findOneAndReplace"
            ],
            default: "find",
        },
        data: {
            type: "string",
            description: "Data to be inserted/updated in JSON string format. Required for insert/update operations.",
        },
        updateOperators: {
            type: "string",
            description: "Update operators in JSON string format. Required for update operations.",
        },
        options: {
            type: "string",
            description: "Additional options in JSON string format (e.g., sort, limit, skip, projection).",
        },
        operationType: {
            type: "string",
            enum: [
                "createIndex",
                "createIndexes",
                "dropIndex",
                "dropIndexes",
                "listIndexes",
                "listCollections",
                "createCollection",
                "dropCollection",
                "renameCollection",
                "collStats",
                "dbStats"
            ],
            description: "Database operation type for index and collection management"
        },
        indexes: {
            type: "string",
            description: "Index specification JSON for index operations"
        },
        indexOptions: {
            type: "string",
            description: "Index options in JSON string format (e.g., unique, sparse, expireAfterSeconds)"
        },
        pipeline: {
            type: "string",
            description: "Aggregation pipeline stages in JSON string format. Required for aggregate operations."
        },
        newName: {
            type: "string",
            description: "New name for renameCollection operation"
        },
        bulkOperations: {
            type: "string",
            description: "Array of bulk write operations in JSON string format. Required for bulkWrite operation."
        }
    },
    required: ["dbName"],
    outputSchema: {
        type: "object",
        properties: {
            content: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            description: "The content type (e.g., 'text')."
                        },
                        text: {
                            type: "string",
                            description: "The query result in JSON string format."
                        }
                    },
                    required: ["type", "text"]
                },
                description: "An array containing the query result."
            },
            isError: {
                type: "boolean",
                description: "Indicates whether an error occurred during the query.",
                default: false
            }
        },
        required: ["content"]
    }
};
const isValidQuery = (query: string): boolean => {
    // Enhanced validation to prevent injection attacks
    if (query.includes("$where") || query.includes("eval(") || query.includes("$function")) {
        return false;
    }

    try {
        const parsed = JSON.parse(query);
        // Additional validation logic could be added here
        return true;
    } catch (e) {
        return false;
    }
};

// 文本索引校验
function validateTextIndexFields(spec: Record<string, any>) {
    const textFields = Object.values(spec).filter(v => v === 'text');
    if (textFields.length > 3) {
        throw new Error("Text index supports up to 3 fields");
    }
}

// 安全解析JSON字符串
function safeParseJSON(jsonString: string | undefined, defaultValue: any = {}) {
    if (!jsonString) return defaultValue;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error(`Invalid JSON format: ${e instanceof Error ? e.message : String(e)}`);
    }
}

export default async (request: any) => {
    try {
        const args = request.params.arguments || {};
        const dbName = String(args.dbName);
        const collectionName = args.collectionName ? String(args.collectionName) : null;
        const queryType = String(args.queryType || "find");
        const operationType = args.operationType;

        // Check for index operations permission
        if (process.env.MONGO_INDEX_OPS !== 'true' &&
            (operationType === 'createIndex' ||
                operationType === 'createIndexes' ||
                operationType === 'dropIndex' ||
                operationType === 'dropIndexes')) {
            throw new Error('Please configure the MCP environment variable "MONGO_INDEX_OPS": "true" to perform index-related operations.');
        }

        // Get database and collection
        const db: Db = mongoClient.db(dbName);
        const collection = collectionName ? db.collection(collectionName) : null;

        // Parse options if provided
        const options = args.options ? safeParseJSON(args.options) : {};

        let results: any;

        // Handle database/collection operations
        if (operationType) {
            switch (operationType) {
                case "createIndex":
                    if (!collection) throw new Error("Collection name is required for createIndex operation");
                    const indexSpec = safeParseJSON(args.indexes);
                    validateTextIndexFields(indexSpec);
                    const indexOptions = safeParseJSON(args.indexOptions, {});
                    results = await collection.createIndex(indexSpec, indexOptions);
                    break;

                case "createIndexes":
                    if (!collection) throw new Error("Collection name is required for createIndexes operation");
                    const indexesArray = safeParseJSON(args.indexes);
                    if (!Array.isArray(indexesArray)) {
                        throw new Error("Indexes must be an array for createIndexes operation");
                    }
                    results = await collection.createIndexes(indexesArray);
                    break;

                case "dropIndex":
                    if (!collection) throw new Error("Collection name is required for dropIndex operation");
                    const dropIndexSpec = safeParseJSON(args.indexes);
                    results = await collection.dropIndex(dropIndexSpec);
                    break;

                case "dropIndexes":
                    if (!collection) throw new Error("Collection name is required for dropIndexes operation");
                    results = await collection.dropIndexes();
                    break;

                case "listIndexes":
                    if (!collection) throw new Error("Collection name is required for listIndexes operation");
                    results = await collection.listIndexes().toArray();
                    break;

                case "listCollections":
                    const filter = args.where ? safeParseJSON(args.where) : {};
                    results = await db.listCollections(filter, options).toArray();
                    break;

                case "dropCollection":
                    if (!collectionName) throw new Error("Collection name is required for dropCollection operation");
                    results = await db.dropCollection(collectionName);
                    break;

                case "createCollection":
                    if (!collectionName) throw new Error("Collection name is required for createCollection operation");
                    await db.createCollection(collectionName, options);
                    results = {
                        success: true,
                        message: `Collection '${collectionName}' created successfully`
                    };
                    break;

                case "renameCollection":
                    if (!collection) throw new Error("Collection name is required for renameCollection operation");
                    if (!args.newName) {
                        throw new Error("newName is required for renameCollection operation");
                    }
                    await collection.rename(args.newName);
                    results = {
                        success: true,
                        message: `Collection '${collectionName}' renamed to '${args.newName}' successfully`
                    };
                    break;
                case "collStats":
                    if (!collectionName) throw new Error("Collection name is required for collStats operation");
                    // 使用命令方式获取集合统计信息
                    results = await db.command({ collStats: collectionName });
                    break;

                case "dbStats":
                    // 使用命令方式获取数据库统计信息
                    results = await db.command({ dbStats: 1 });
                    break;

                default:
                    throw new Error(`Unsupported operation type: ${operationType}`);
            }
        }
        // Handle query operations
        else {
            if (!collection) throw new Error("Collection name is required for query operations");

            // Validate and parse where clause if needed
            let where = {};
            if (args.where && ["find", "findOne", "count", "updateOne", "updateMany", "deleteOne", "deleteMany",
                "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace"].includes(queryType)) {
                if (!isValidQuery(args.where)) {
                    throw new Error("Invalid query: Query contains potentially harmful operations.");
                }
                where = safeParseJSON(args.where);
            }

            switch (queryType) {
                case "find":
                    const cursor = collection.find(where, options);

                    // Apply sort, limit, skip if provided in options
                    if (options.sort) cursor.sort(options.sort);
                    if (options.limit) cursor.limit(options.limit);
                    if (options.skip) cursor.skip(options.skip);

                    results = await cursor.toArray();
                    break;

                case "findOne":
                    results = await collection.findOne(where, options);
                    break;

                case "aggregate":
                    const pipeline = args.pipeline ? safeParseJSON(args.pipeline) : [];
                    if (!Array.isArray(pipeline)) {
                        throw new Error("Pipeline must be an array for aggregate operation");
                    }
                    results = await collection.aggregate(pipeline, options).toArray();
                    break;

                case "count":
                    results = await collection.countDocuments(where, options);
                    break;

                case "estimatedDocumentCount":
                    results = await collection.estimatedDocumentCount(options);
                    break;

                case "distinct":
                    if (!args.field) {
                        throw new Error("Field name is required in 'field' for distinct operation");
                    }
                    const query = Object.values(where)[0] || {};
                    results = await collection.distinct(args.field, query);
                    break;

                case "insertOne":
                    if (!args.data) {
                        throw new Error("Data is required for insertOne operation");
                    }
                    const insertData = safeParseJSON(args.data);
                    results = await collection.insertOne(insertData, options);
                    break;

                case "insertMany":
                    if (!args.data) {
                        throw new Error("Data is required for insertMany operation");
                    }
                    const insertManyData = safeParseJSON(args.data);
                    if (!Array.isArray(insertManyData)) {
                        throw new Error("Data must be an array for insertMany operation");
                    }
                    results = await collection.insertMany(insertManyData, options);
                    break;

                case "updateOne":
                    if (!args.updateOperators) {
                        throw new Error("Update operators are required for updateOne operation");
                    }
                    const updateOps = safeParseJSON(args.updateOperators);
                    results = await collection.updateOne(where, updateOps, options);
                    break;

                case "updateMany":
                    if (!args.updateOperators) {
                        throw new Error("Update operators are required for updateMany operation");
                    }
                    const updateManyOps = safeParseJSON(args.updateOperators);
                    results = await collection.updateMany(where, updateManyOps, options);
                    break;

                case "deleteOne":
                    results = await collection.deleteOne(where, options);
                    break;

                case "deleteMany":
                    results = await collection.deleteMany(where, options);
                    break;

                case "bulkWrite":
                    if (!args.bulkOperations) {
                        throw new Error("Bulk operations are required for bulkWrite operation");
                    }
                    const bulkOps = safeParseJSON(args.bulkOperations);
                    if (!Array.isArray(bulkOps)) {
                        throw new Error("Bulk operations must be an array");
                    }
                    results = await collection.bulkWrite(bulkOps, options);
                    break;

                case "findOneAndUpdate":
                    if (!args.updateOperators) {
                        throw new Error("Update operators are required for findOneAndUpdate operation");
                    }
                    const findUpdateOps = safeParseJSON(args.updateOperators);
                    results = await collection.findOneAndUpdate(where, findUpdateOps, options);
                    break;

                case "findOneAndDelete":
                    results = await collection.findOneAndDelete(where, options);
                    break;

                case "findOneAndReplace":
                    if (!args.data) {
                        throw new Error("Replacement document is required for findOneAndReplace operation");
                    }
                    const replacement = safeParseJSON(args.data);
                    results = await collection.findOneAndReplace(where, replacement, options);
                    break;

                default:
                    throw new Error(`Unsupported query type: ${queryType}`);
            }
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    } catch (error: any) {
        let errorMessage = "MongoDB operation error";
        let errorCode = "UNKNOWN_ERROR";

        if (error instanceof Error) {
            errorMessage = error.message;
            errorCode = error.name;
        }

        const errorResponse = {
            error: {
                code: errorCode,
                message: errorMessage,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
        };

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(errorResponse, null, 2),
                },
            ],
            isError: true,
        };
    }
};

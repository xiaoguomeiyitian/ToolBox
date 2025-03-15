import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI environment variable is not set.");
const mongoClient = await MongoClient.connect(mongoUri, {
    maxPoolSize: 2,
    maxIdleTimeMS: 60 * 1000
});

/** mongo_tool 工具的参数列表 */
export const schema = {
    name: "mongo_tool",
    description: "Query MongoDB data",
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
        queryType: {
            type: "string",
            description: "The type of MongoDB query to execute.",
            enum: [
                "find",
                "aggregate",
                "count",
                "distinct",
                "insertOne",
                "updateOne",
                "deleteOne",
                "insertMany",
                "updateMany",
                "deleteMany"
            ],
            default: "find",
        },
        data: {
            type: "string",
            description: "Data to be inserted in JSON string format. Required for insertOne and insertMany operations.",
        },
        updateOperators: {
            type: "string",
            description: "Update operators in JSON string format. Required for updateOne and updateMany operations.",
        },
        operationType: {
            type: "string",
            enum: ["createIndex", "dropIndex", "listIndexes"],
            description: "Index operation type"
        },
        indexes: {
            type: "string",
            description: "Index specification JSON"
        }
    },
    required: ["where", "dbName", "collectionName"],
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
    return true;
};

// 文本索引校验
function validateTextIndexFields(spec: Record<string, any>) {
    const textFields = Object.values(spec).filter(v => v === 'text');
    if (textFields.length > 3) {
        throw new Error("Text index supports up to 3 fields");
    }
}

export default async (request: any) => {
    try {
        if (process.env.MONGO_INDEX_OPS !== 'true' && (request.params.arguments?.operationType === 'createIndex' || request.params.arguments?.operationType === 'dropIndex')) {
            throw new Error('Please configure the MCP environment variable "MONGO_INDEX_OPS": "true" to perform index-related operations.');
        }

        const whereString = String(request.params.arguments?.where);

        if (!isValidQuery(whereString)) {
            throw new Error("Invalid query: Query contains potentially harmful operations.");
        }

        const where = JSON.parse(whereString);
        const dbName = String(request.params.arguments?.dbName);
        const collectionName = String(request.params.arguments?.collectionName);
        const queryType = String(request.params.arguments?.queryType || "find");
        const data = request.params.arguments?.data;
        const updateOperators = request.params.arguments?.updateOperators;
        const operationType = String(request.params.arguments?.operationType);
        const db: Db = mongoClient.db(dbName);

        const collection = db.collection(collectionName);

        let results: any;

        switch (operationType) {
            case "createIndex":
                try {
                    const indexes = request.params.arguments?.indexes;
                    const indexSpec = JSON.parse(indexes);
                    validateTextIndexFields(indexSpec);
                    results = await collection.createIndex(indexSpec);
                } catch (e: any) {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({error: "Failed to create index: " + e.message})
                        }],
                        isError: true
                    }
                }
                break;
            case "dropIndex":
                 try {
                    const indexes = request.params.arguments?.indexes;
                    const indexSpec = JSON.parse(indexes);
                    results = await collection.dropIndex(indexSpec);
                 } catch (e: any) {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({error: "Failed to drop index: " + e.message})
                        }],
                        isError: true
                    }
                }
                break;
            case "listIndexes":
                results = await collection.listIndexes().toArray();
                break;
            default:
                switch (queryType) {
                    case "aggregate":
                        results = await collection.aggregate(where).toArray();
                        break;
                    case "count":
                        results = await collection.countDocuments(where);
                        break;
                    case "distinct":
                        // 需要从 where 中提取 field
        const field = Object.keys(where)[0];
                        results = await collection.distinct(field, {});
                        break;
                    case "insertOne":
                        if (!data) {
                            throw new Error("Data is required for insertOne operation.");
                        }
                        results = await collection.insertOne(JSON.parse(data));
                        break;
                    case "updateOne":
                        if (!updateOperators) {
                            throw new Error("Update operators are required for updateOne operation");
                        }
                        results = await collection.updateOne(
                            where,
                            JSON.parse(updateOperators)
                        );
                        break;
                    case "deleteOne":
                        results = await collection.deleteOne(where);
                        break;
                    case "insertMany":
                        if (!data) {
                            throw new Error("Data is required for insertMany operation");
                        }
                        results = await collection.insertMany(JSON.parse(data));
                        break;
                    case "updateMany":
                        if (!updateOperators) {
                            throw new Error("Update operators are required for updateMany operation");
                        }
                        results = await collection.updateMany(
                            where,
                            JSON.parse(updateOperators)
                        );
                        break;
                    case "deleteMany":
                        results = await collection.deleteMany(where);
                        break;
                    default:
                        const cursor = collection.find(where).stream();
                        results = [];
                        await new Promise((resolve, reject) => {
                            cursor.on('data', (doc: any) => {
                                (results as any[]).push(doc);
                            });

                            cursor.on('end', async () => {
                                resolve(null);
                            });

                            cursor.on('error', (err: any) => {
                                reject(err);
                            });
                        });
                        break;
                }
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results),
                },
            ],
        };
    } catch (error: any) {
        let errorMessage = "MongoDB query error";
        let errorCode = "UNKNOWN_ERROR";

        if (error instanceof Error) {
            errorMessage = error.message;
            errorCode = error.name;
        }

        const errorResponse = {
            error: {
                code: errorCode,
                message: errorMessage,
            },
        };

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(errorResponse),
                },
            ],
            isError: true,
        };
    }
};

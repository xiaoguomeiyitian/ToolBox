import { Redis } from 'ioredis';

// 获取 Redis 连接 URL
const REDIS_URI = process.env.REDIS_URI;
if (!REDIS_URI) throw new Error("REDIS_URI environment variable is not set.");
const redisClient: Redis = new Redis(REDIS_URI);

/** redis_tool 工具的参数列表 */
export const schema = {
    name: "redis_tool",
    description: "Operate Redis data",
    type: "object",
    properties: {
        command: {
            type: "string",
            description: "The Redis command to execute.",
        },
        args: {
            type: "string",
            description: "The arguments for the Redis command in JSON string format.",
        },
    },
    required: ["command"],
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

export default async (request: any) => {
    try {
        const command = String(request.params.arguments?.command);
        const argsString = request.params.arguments?.args;
        let args = [];
        try {
            args = argsString ? JSON.parse(argsString) : [];
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: "Invalid JSON format for args" }),
                    },
                ],
                isError: true,
            };
        }

        let results: any;

        try {
            results = await redisClient.call(command, ...args);
        } catch (error: any) {
            const errorResponse = {
                error: {
                    code: error.code,
                    message: error.message,
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

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results),
                },
            ],
        };
    } catch (error: any) {
        let errorMessage = "Redis query error";
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

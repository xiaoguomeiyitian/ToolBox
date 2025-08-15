import { Redis } from 'ioredis';

// 获取 Redis 连接 URL
const REDIS_URI = process.env.REDIS_URI;
if (!REDIS_URI) throw new Error("REDIS_URI environment variable is not set.");
const redisClient: Redis = new Redis(REDIS_URI, {
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true, // 改为true允许离线队列
    enableReadyCheck: true,   // 添加就绪检查
    connectTimeout: 5000      // 添加连接超时
});
/** Parameter list for the redis_tool */
export const schema = {
    name: "redis_tool",
    description: "Execute Redis commands (strings, hashes, lists, sets, etc.)",
    type: "object",
    properties: {
        command: {
            type: "string",
            description: "Redis command to execute (e.g., 'GET', 'SET')",
        },
        args: {
            type: "string",
            description: "Arguments for the command (JSON string)",
        },
    },
    required: ["command"]
};

export default async (request: any) => {
    try {
        const command = String(request.params.arguments?.command).toUpperCase();
        const argsString = request.params.arguments?.args;
        let args = [];
        try {
            args = argsString ? JSON.parse(argsString) : [];
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: "Invalid JSON format for the 'args' parameter",
                            hint: "'args' should be a valid JSON array string. For example: '[\"key\", \"value\"]'"
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }

        let results: any;

        try {
            results = await redisClient.call(command, ...args);

            // Formats Redis results based on command type for improved readability
            const formattedResults = formatRedisResults(command, results);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(formattedResults, null, 2),
                    },
                ],
            };
        } catch (error: any) {
            const errorResponse = {
                error: {
                    code: error.code || "REDIS_ERROR",
                    message: error.message,
                },
                command: command,
                args: args,
                hint: getErrorHint(command, error.message)
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
                    text: JSON.stringify(errorResponse, null, 2),
                },
            ],
            isError: true,
        };
    }
};

/**
 * Formats Redis results based on command type for improved readability
 */
function formatRedisResults(command: string, results: any): any {
    // Handle null results
    if (results === null) {
        return { result: null };
    }

    // Handle array results from commands like HGETALL
    if (Array.isArray(results) && command === 'HGETALL') {
        const obj: Record<string, any> = {};
        for (let i = 0; i < results.length; i += 2) {
            if (i + 1 < results.length) {
                obj[results[i]] = results[i + 1];
            }
        }
        return obj;
    }

    // Handle other array results
    if (Array.isArray(results)) {
        return results;
    }

    // Handle Buffer results
    if (Buffer.isBuffer(results)) {
        return results.toString();
    }

    return results;
}

/**
 * Provides helpful hints for common Redis errors
 */
function getErrorHint(command: string, errorMessage: string): string {
    if (errorMessage.includes("wrong number of arguments")) {
        return getCommandSyntaxHint(command);
    }

    if (errorMessage.includes("WRONGTYPE")) {
        return "The data type of the key does not match the requested command operation.";
    }

    if (errorMessage.includes("no such key")) {
        return "The specified key does not exist.";
    }

    return "Please check the command syntax and parameters.";
}

/**
 * Provides syntax hints for common Redis commands
 */
function getCommandSyntaxHint(command: string): string {
    const syntaxMap: Record<string, string> = {
        'GET': 'GET key',
        'SET': 'SET key value [EX seconds] [PX milliseconds] [NX|XX]',
        'HGET': 'HGET key field',
        'HSET': 'HSET key field value [field value ...]',
        'HGETALL': 'HGETALL key',
        'LPUSH': 'LPUSH key element [element ...]',
        'RPUSH': 'RPUSH key element [element ...]',
        'LRANGE': 'LRANGE key start stop',
        'SADD': 'SADD key member [member ...]',
        'SMEMBERS': 'SMEMBERS key',
        'ZADD': 'ZADD key score member [score member ...]',
        'ZRANGE': 'ZRANGE key start stop [WITHSCORES]',
        'DEL': 'DEL key [key ...]',
        'EXISTS': 'EXISTS key [key ...]',
        'EXPIRE': 'EXPIRE key seconds',
        'TTL': 'TTL key',
        'INCR': 'INCR key',
        'DECR': 'DECR key',
    };

    return syntaxMap[command] || `Please consult the Redis documentation for the syntax of ${command}.`;
}

// Destroy function
export async function destroy() {
    console.log("Destroy redis_tool");
    if (redisClient) {
        try {
            // 直接物理断开连接
            redisClient.disconnect();
        } catch (error) {
            console.error("Force disconnect error:", error.message);
        }
    }
}

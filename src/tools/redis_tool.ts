import { Redis } from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Gets a Redis client instance, creating one if necessary.
 * This handles initial connection and reconnection after a tool reload.
 * @returns {Redis} An active ioredis client instance.
 */
function getClient(): Redis {
    const redisUri = process.env.REDIS_URI;
    if (!redisUri) {
        throw new Error("REDIS_URI environment variable is not set.");
    }

    // If client is null or has been disconnected (status 'end'), create a new one.
    if (redisClient === null || redisClient.status === 'end') {
        redisClient = new Redis(redisUri, {
            retryStrategy: times => Math.min(times * 50, 2000),
            maxRetriesPerRequest: 3,
            enableOfflineQueue: true,
            enableReadyCheck: true,
            connectTimeout: 5000,
        });
    }
    return redisClient;
}

/**
 * A set of dangerous Redis commands that are blocked from execution.
 */
const DANGEROUS_COMMANDS = new Set([
    'FLUSHALL', 'FLUSHDB', 'KEYS', 'SHUTDOWN', 'CONFIG', 
    'SCRIPT', 'EVAL', 'EVALSHA', 'SAVE', 'BGSAVE', 'SLAVEOF'
]);

/** Parameter list for the redis_tool */
export const schema = {
    name: "redis_tool",
    description: "执行 Redis 命令，支持字符串、哈希、列表、集合等多种数据结构。",
    type: "object",
    properties: {
        command: {
            type: "string",
            description: "要执行的 Redis 命令 (例如, 'GET', 'SET')",
        },
        args: {
            type: "array",
            description: "命令的参数列表 (例如: [\"mykey\", \"myvalue\"])",
            items: {
                type: "string"
            },
            default: []
        },
    },
    required: ["command"]
};

export default async (request: any) => {
    try {
        const command = String(request.params.arguments?.command).toUpperCase();
        const args = request.params.arguments?.args || [];

        if (DANGEROUS_COMMANDS.has(command)) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        error: "Execution of dangerous command is denied.",
                        command: command,
                        hint: `The command '${command}' is on the denylist for security reasons.`
                    }, null, 2),
                }],
                isError: true,
            };
        }

        if (!Array.isArray(args)) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        error: "Invalid parameter type for 'args'",
                        hint: "'args' must be an array of strings. For example: [\"key\", \"value\"]"
                    }, null, 2),
                }],
                isError: true,
            };
        }

        const client = getClient();
        const results = await client.call(command, ...args);
        const formattedResults = formatRedisResults(command, results);

        return {
            content: [{
                type: "text",
                text: JSON.stringify(formattedResults, null, 2),
            }],
        };

    } catch (error: any) {
        const command = request.params.arguments?.command || 'UNKNOWN';
        const args = request.params.arguments?.args || [];
        const errorResponse = {
            error: {
                code: error.code || error.name || "REDIS_ERROR",
                message: error.message,
            },
            command: command,
            args: args,
            hint: getErrorHint(command, error.message)
        };
        return {
            content: [{
                type: "text",
                text: JSON.stringify(errorResponse, null, 2),
            }],
            isError: true,
        };
    }
};

/**
 * Formats Redis results based on command type for improved readability
 */
function formatRedisResults(command: string, results: any): any {
    if (results === null) {
        return { result: null };
    }

    if (Array.isArray(results) && command.toUpperCase() === 'HGETALL') {
        const obj: Record<string, any> = {};
        for (let i = 0; i < results.length; i += 2) {
            if (i + 1 < results.length) {
                obj[results[i]] = results[i + 1];
            }
        }
        return obj;
    }

    if (Buffer.isBuffer(results)) {
        return results.toString();
    }

    return results;
}

/**
 * Provides helpful hints for common Redis errors
 */
function getErrorHint(command: string, errorMessage: string): string {
    const upperCaseCommand = command.toUpperCase();
    if (errorMessage.includes("wrong number of arguments")) {
        return getCommandSyntaxHint(upperCaseCommand);
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
            // Forcefully disconnect for tool reloads
            redisClient.disconnect();
        } catch (error: any) {
            console.error("Force disconnect error:", error.message);
        }
    }
}

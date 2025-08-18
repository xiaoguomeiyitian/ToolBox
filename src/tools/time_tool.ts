// Helper to validate timezone
function isValidTimeZone(tz: string) {
    if (!tz) return false;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch (ex) {
        return false;
    }
}

export const schema = {
    name: "time_tool",
    description: "Get and convert time, supporting timezones, formatting, and timestamp operations.",
    type: "object",
    properties: {
        action: {
            type: "string",
            description: "The operation to perform.",
            enum: ["get_current_time", "format_time", "from_timestamp", "to_timestamp"],
        },
        time_str: {
            type: "string",
            description: "An ISO 8601 time string (e.g., '2025-03-15T10:00:00Z'). Required for 'format_time' and 'to_timestamp'."
        },
        timezone: {
            type: "string",
            description: "The target timezone (e.g., 'UTC', 'America/New_York', 'Asia/Shanghai')."
        },
        timestamp: {
            type: "number",
            description: "Unix timestamp in milliseconds. Required for 'from_timestamp'."
        },
        format_options: {
            type: "object",
            description: "Formatting options for the time string, based on Intl.DateTimeFormat.",
            properties: {
                year: { type: "string", enum: ["numeric", "2-digit"] },
                month: { type: "string", enum: ["numeric", "2-digit", "long", "short", "narrow"] },
                day: { type: "string", enum: ["numeric", "2-digit"] },
                hour: { type: "string", enum: ["numeric", "2-digit"] },
                minute: { type: "string", enum: ["numeric", "2-digit"] },
                second: { type: "string", enum: ["numeric", "2-digit"] },
                timeZoneName: { type: "string", enum: ["long", "short"] }
            }
        }
    },
    required: ["action"]
};

// Action: get_current_time
async function getCurrentTime(timezone: string | undefined, format_options: object | undefined) {
    const now = new Date();
    if (timezone && !isValidTimeZone(timezone)) {
        throw new Error(`Invalid timezone: ${timezone}`);
    }
    return new Intl.DateTimeFormat('en-US', { ...format_options, timeZone: timezone }).format(now);
}

// Action: format_time
async function formatTime(time_str: string, timezone: string | undefined, format_options: object | undefined) {
    const date = new Date(time_str);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid time_str format: "${time_str}". Please use ISO 8601 format.`);
    }
    if (timezone && !isValidTimeZone(timezone)) {
        throw new Error(`Invalid timezone: ${timezone}`);
    }
    return new Intl.DateTimeFormat('en-US', { ...format_options, timeZone: timezone }).format(date);
}

// Action: from_timestamp
async function fromTimestamp(timestamp: number, timezone: string | undefined, format_options: object | undefined) {
    const date = new Date(timestamp);
    if (timezone && !isValidTimeZone(timezone)) {
        throw new Error(`Invalid timezone: ${timezone}`);
    }
    return new Intl.DateTimeFormat('en-US', { ...format_options, timeZone: timezone }).format(date);
}

// Action: to_timestamp
async function toTimestamp(time_str: string) {
    const date = new Date(time_str);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid time_str format: "${time_str}". Please use ISO 8601 format.`);
    }
    return date.getTime();
}


export default async (request: any) => {
    try {
        const { action, time_str, timezone, timestamp, format_options } = request.params.arguments;

        let result: string | number;

        switch (action) {
            case "get_current_time":
                result = await getCurrentTime(timezone, format_options);
                break;
            
            case "format_time":
                if (!time_str) throw new Error("time_str is required for format_time");
                result = await formatTime(time_str, timezone, format_options);
                break;

            case "from_timestamp":
                if (timestamp === undefined) throw new Error("timestamp is required for from_timestamp");
                result = await fromTimestamp(timestamp, timezone, format_options);
                break;

            case "to_timestamp":
                if (!time_str) throw new Error("time_str is required for to_timestamp");
                result = await toTimestamp(time_str);
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ result }, null, 2),
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ error: error.message }, null, 2),
                },
            ],
            isError: true
        };
    }
};

// Destroy function
export async function destroy() {
    console.log("Destroy time_tool");
}

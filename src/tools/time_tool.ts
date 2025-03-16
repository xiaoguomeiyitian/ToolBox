/** time_tool 工具的参数列表 */
export const schema = {
    name: "time_tool",
    description: "Get current time",
    type: "object",
    properties: {
        format: {
            type: "string",
            description: "The format of the time to return (iso, timestamp, local, custom). Defaults to iso.",
            enum: ["iso", "timestamp", "local", "custom"]
        },
        pattern: {
            type: "string",
            description: "The custom format pattern to use when format is custom. Required when format is custom."
        },
        timezone: {
            type: "string",
            description: "The timezone to use. Defaults to the system's timezone. Example: Asia/Shanghai"
        }
    },
    required: [],
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
    },
};

enum TimeFormat {
    ISO = 'iso',
    TIMESTAMP = 'timestamp',
    LOCAL = 'local',
    CUSTOM = 'custom'
}

const timezoneWhitelist = ['Asia/Shanghai', 'America/New_York'];

export default async (request: any) => {
    try {
        const format: TimeFormat = request.params.arguments?.format || TimeFormat.ISO;
        const pattern: string = request.params.arguments?.pattern;
        const timezone: string = request.params.arguments?.timezone;

        let now = new Date();

        if (timezone && timezoneWhitelist.indexOf(timezone) === -1) {
            throw new Error(`Invalid timezone: ${timezone}`);
        }

        let date = timezone ? new Date(now.toLocaleString('en-US', { timeZone: timezone })) : now;

        let formattedTime: string;

        switch (format) {
            case TimeFormat.ISO:
                formattedTime = date.toISOString();
                break;
            case TimeFormat.TIMESTAMP:
                formattedTime = String(date.getTime());
                break;
            case TimeFormat.LOCAL:
                formattedTime = date.toLocaleString();
                break;
            case TimeFormat.CUSTOM:
                if (!pattern) {
                    throw new Error("Pattern is required for custom format");
                }

                if (pattern.length < 2 || pattern.length > 50) {
                    throw new Error("Pattern length must be between 2 and 50 characters");
                }

                const replacements = {
                    'YYYY': String(date.getFullYear()),
                    'MM': String(date.getMonth() + 1).padStart(2, '0'),
                    'DD': String(date.getDate()).padStart(2, '0'),
                    'HH': String(date.getHours()).padStart(2, '0'),
                    'mm': String(date.getMinutes()).padStart(2, '0'),
                    'ss': String(date.getSeconds()).padStart(2, '0'),
                };

                formattedTime = pattern.replace(/(YYYY|MM|DD|HH|mm|ss)/gi, matched => replacements[matched] || matched);
                break;
            default:
                throw new Error(`Invalid format: ${format}`);
        }

        return {
            content: [
                {
                    type: "text",
                    text: `Current time: ${formattedTime}`,
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting time: ${error.message}`,
                },
            ],
            isError: true
        };
    }
};

// Destroy function
export async function destroy() {
    // Release resources, stop timers, disconnect, etc.
    console.log("Destroy time_tool");
}

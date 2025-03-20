/** time_tool 工具的参数列表 */
export const schema = {
    name: "time_tool",
    description: "Get current time",
    type: "object",
    properties: {
        format: {
            type: "string",
            description: "Time format (iso, timestamp, local, custom)",
            enum: ["iso", "timestamp", "local", "custom"]
        },
        pattern: {
            type: "string",
            description: "Custom format pattern (required if format=custom)"
        },
        timezone: {
            type: "string",
            description: "Timezone (e.g., Asia/Shanghai)"
        }
    },
    required: []
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
                    text: JSON.stringify(`Current time: ${formattedTime}`, null, 2),
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(`Error getting time: ${error.message}`, null, 2),
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

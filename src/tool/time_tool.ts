/** time_tool 工具的参数列表 */
export const schema = {
    name: "time_tool",
    description: "Get current time",
    type: "object",
    properties: {},
    required: [],
};

export default async (request: any) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Current time: ${currentTime}`,
                },
            ],
        };
    } catch (error: any) {
        console.error(`Error getting time: ${error}`);
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

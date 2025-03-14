import path from 'path';
import { toolDir, toolFiles } from '../index.js';
import { LogService } from '../logService.js';

const tools: any[] = [];
const ToolHandler: { [key: string]: any } = {};

export async function loadTools() {
    for (const file of toolFiles) {
        const toolPath = path.join(toolDir, file);
        try {
            const { default: tool, schema } = await import('file://' + toolPath);
            const toolName = path.basename(file, path.extname(file));

            tools.push({
                name: toolName,
                description: tool.description,
                inputSchema: schema,
            });

            ToolHandler[toolName] = async (request: any) => {
                return await tool(request);
            };
        } catch (error) {
            console.error(`Failed to load tool ${file}:`, error);
        }
    }
    return ToolHandler;
}
/** 所有工具列表 */
export const listToolsHandler = async () => { return { tools: tools }; };
/** 调用某个工具 */
export const callToolHandler = async (request: any, caller: string) => {
    const start = Date.now();
    const toolName = request.params.name;
    try {
        if (ToolHandler[toolName]) {
            const result = await ToolHandler[toolName](request);
            LogService.log({
                ts: new Date().toISOString(),
                tool: toolName,
                caller: caller,
                args: request.params.arguments,
                stat: 'success',
                cost: Date.now() - start,
            });
            return result;
        }
        throw new Error("Unknown tool");
    } catch (error: any) {
        LogService.log({
            ts: new Date().toISOString(),
            tool: toolName,
            args: request.params.arguments,
            stat: 'error',
            err: error.message,
            trace: error.stack,
            cost: Date.now() - start,
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(error.message),
                },
            ],
            isError: true,
        };
    }
};

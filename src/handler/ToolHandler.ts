import fs from 'fs';
import path from 'path';
import { toolsDir } from '../config.js';
import { LogService } from '../logService.js';

let isload: boolean = false;
const tools: any[] = [];
const ToolHandler: { [key: string]: any } = {};

export async function loadTools() {
    const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js'));
    for (const file of toolFiles) {
        const toolPath = path.join(toolsDir, file);
        try {
            const { default: tool, schema } = await import('file://' + toolPath);
            const toolName = path.parse(toolPath).name;

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
    isload = true;
}
/** 所有工具列表 */
export const listToolsHandler = async () => { return { tools: tools }; };
/** 调用某个工具 */
export const callToolHandler = async (request: any, caller: string) => {
    if (!isload) await loadTools();//如果工具没有加载则先加载工具
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

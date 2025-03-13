import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ToolHandler } from './index.js';

const toolDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tool');
const toolFiles = fs.readdirSync(toolDir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

const tools: any[] = [];

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
export const callToolHandler = async (request: any) => {
    try {
        if (ToolHandler[request.params.name]) return await ToolHandler[request.params.name](request);
        throw new Error("Unknown tool");
    } catch (error: any) {
        console.error("Tool execution error:", error);
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

export { ToolHandler };

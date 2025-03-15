import fs from 'fs';
import path from 'path';
import { toolsDir } from '../config.js';
import { LogService } from '../logService.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

interface ToolRequest {
  params: {
    name: string;
    arguments: any;
  };
}

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export class ToolManager {
  private static instance: ToolManager;
  private tools: Tool[] = [];
  private handlers: { [key: string]: (request: ToolRequest) => Promise<ToolResponse> } = {};
  private isLoaded: boolean = false;

  private constructor() {}

  public static getInstance(): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager();
    }
    return ToolManager.instance;
  }

  public async loadTools(): Promise<void> {
    if (this.isLoaded) return;
    
    if (!fs.existsSync(toolsDir)) {
      console.warn(`Tools directory not found: ${toolsDir}`);
      fs.mkdirSync(toolsDir, { recursive: true });
      this.isLoaded = true;
      return;
    }

    const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    
    for (const file of toolFiles) {
      const toolPath = path.join(toolsDir, file);
      try {
        const { default: tool, schema } = await import('file://' + toolPath);
        const toolName = path.parse(toolPath).name;

        this.tools.push({
          name: toolName,
          description: tool.description,
          inputSchema: schema,
        });

        this.handlers[toolName] = async (request: ToolRequest) => {
          return await tool(request);
        };
      } catch (error) {
        console.error(`Failed to load tool ${file}:`, error);
      }
    }
    
    this.isLoaded = true;
  }

  public getTools(): Tool[] {
    return this.tools;
  }

  public async callTool(request: ToolRequest, caller: string): Promise<ToolResponse> {
    if (!this.isLoaded) await this.loadTools();
    
    const start = Date.now();
    const toolName = request.params.name;
    
    try {
      if (this.handlers[toolName]) {
        const result = await this.handlers[toolName](request);
        
        await LogService.logAsync({
          ts: new Date().toISOString(),
          tool: toolName,
          caller: caller,
          args: request.params.arguments,
          stat: 'success',
          cost: Date.now() - start,
        });
        
        return result;
      }
      throw new Error(`Unknown tool: ${toolName}`);
    } catch (error: any) {
      await LogService.logAsync({
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
  }
}

// 兼容性导出函数
const toolManager = ToolManager.getInstance();

export async function loadTools() {
  await toolManager.loadTools();
}

export const listToolsHandler = async () => { 
  return { tools: toolManager.getTools() }; 
};

export const callToolHandler = async (request: ToolRequest, caller: string) => {
  return await toolManager.callTool(request, caller);
};

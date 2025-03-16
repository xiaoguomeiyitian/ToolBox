import fs from 'fs';
import path from 'path';
import { toolsDir } from '../config.js';
import { LogService } from '../logService.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  destroy: Function;
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
// 全局状态
const tools: Tool[] = [];
const handlers: { [key: string]: (request: ToolRequest) => Promise<ToolResponse> } = {};
let isLoaded: boolean = false;
/** 清除模块缓存 */
function clearModuleCache(modulePath: string): void {
  try {
    // 将文件路径转换为 URL 格式，因为我们使用 'file://' 导入
    const moduleUrl = 'file://' + modulePath;
    // 检查是否在 CommonJS 环境中
    // 使用可选链和类型检查来避免在 ES 模块环境中出错
    const hasRequire = typeof require !== 'undefined';
    if (hasRequire) {
      try {
        // 对于 CommonJS 模块
        const req = require as any;
        if (req.cache) {
          delete req.cache[req.resolve(modulePath)];
        }
      } catch (e) {
        // 忽略 CommonJS 相关错误
      }
    }
    // 对于 ES 模块，尝试清除全局缓存
    try {
      // 查找可能的 ESM 缓存键
      const cacheKeys = Object.keys(globalThis).filter(key =>
        key.startsWith('__import_meta_resolve__') ||
        key.includes('esm_cache') ||
        key.includes('module_cache')
      );

      for (const key of cacheKeys) {
        if ((globalThis as any)[key] && typeof (globalThis as any)[key] === 'object') {
          // 尝试删除模块 URL
          delete (globalThis as any)[key][moduleUrl];

          // 也尝试删除可能的变体
          const urlVariants = [
            moduleUrl,
            moduleUrl + '.js',
            moduleUrl + '.ts',
            moduleUrl + '.mjs',
            moduleUrl + '?update=' + Date.now()
          ];

          for (const variant of urlVariants) {
            if ((globalThis as any)[key][variant]) {
              delete (globalThis as any)[key][variant];
            }
          }
        }
      }
    } catch (e) {
      // 忽略 ESM 缓存清理错误
    }
    // 最有效的方法是在导入时添加查询参数
    // 这将在 loadToolsInternal 函数中处理
  } catch (error) {
    console.warn(`Failed to clear cache for module ${modulePath}:`, error);
  }
}
/**
 * 加载工具函数，支持初始加载和重新加载
 * @param reload 是否为重新加载模式
 */
export async function loadTools(reload: boolean = false): Promise<{ [key: string]: (request: ToolRequest) => Promise<ToolResponse> }> {
  // 如果是初始加载且已加载，则直接返回
  if (!reload && isLoaded) return;

  // 如果是重新加载，则重置状态
  if (reload) {
    for (const tool of tools) {
      await tool?.destroy?.();
      delete handlers[tool.name];
    }
    tools.length = 0;
    isLoaded = false;
  }

  // 获取所有工具文件
  const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

  // 加载每个工具
  for (const file of toolFiles) {
    const toolPath = path.join(toolsDir, file);
    try {
      // 如果是重新加载，清除模块缓存
      if (reload) clearModuleCache(toolPath);

      // 导入模块，重新加载时添加时间戳防止缓存
      const importPath = 'file://' + toolPath + (reload ? `?update=${Date.now()}` : '');
      const { default: tool, schema, destroy } = await import(importPath);
      const toolName = path.parse(toolPath).name;

      // 注册工具
      tools.push({
        name: toolName,
        description: tool.description,
        inputSchema: schema,
        destroy: destroy
      });

      // 注册处理函数
      handlers[toolName] = async (request: ToolRequest) => { return await tool(request); };
    } catch (error) {
      console.error(`Failed to ${reload ? 'reload' : 'load'} tool ${file}:`, error);
    }
  }

  isLoaded = true;
  if (reload) console.log(`Successfully reloaded ${tools.length} tools`);

  return handlers;
}
/** 获取工具列表 */
export const listToolsHandler = async () => { return { tools: tools }; };
/* 调用工具的处理函数 */
export const callToolHandler = async (request: ToolRequest, caller: string) => {
  if (!isLoaded) await loadTools();

  const start = Date.now();
  const toolName = request.params.name;

  try {
    if (handlers[toolName]) {
      const result = await handlers[toolName](request);

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
};
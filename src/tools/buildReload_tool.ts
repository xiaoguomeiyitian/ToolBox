import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { loadTools } from '../handler/ToolHandler.js';

// 获取当前文件所在目录的上两级目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(path.dirname(__dirname));  // 上溯两级目录

export const schema = {
  name: "buildReload_tool",
  description: "Execute 'npm run build' and reload tools",
  type: "object",
  properties: {},
  required: []
};

export default async function (request: any) {
  try {
    //  执行编译命令
    const buildOutput = execSync('npm run build', {
      cwd: PROJECT_ROOT,  // 使用计算出的项目根目录
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 300000  // 5分钟超时
    });

    // 阶段 2: 重新加载工具
    const handlers = await loadTools(true);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            build: {
              success: true,
              output: buildOutput,
              directory: PROJECT_ROOT  // 返回实际使用的目录
            },
            reload: {
              success: !!handlers,
              tools: Object.keys(handlers).length
            }
          }, null, 2)
        }
      ]
    };

  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      directory: PROJECT_ROOT,  // 包含目录信息
      system: {
        platform: process.platform,
        versions: process.versions
      }
    };

    // 如果是执行命令错误，添加额外信息
    if (error instanceof Error && 'code' in error) {
      Object.assign(errorInfo, {
        exitCode: error.code,
        stdout: (error as any).stdout,
        stderr: (error as any).stderr
      });
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "BuildReload_FAILED",
          details: errorInfo
        }, null, 2)
      }],
      isError: true
    };
  }
}

// Destroy function
export async function destroy() {
  // Release resources, stop timers, disconnect, etc.
  console.log("Destroy buildReload_tool");
}

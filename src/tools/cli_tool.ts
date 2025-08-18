import { spawn, SpawnOptions } from 'child_process';
import { platform } from 'os';

export const schema = {
  name: "cli_tool",
  description: "执行CLI命令，支持同步/异步模式、超时和安全过滤。",
  type: "object",
  properties: {
    command: { type: "string", description: "要执行的单行命令" },
    commands: {
      type: "array",
      items: { type: "string" },
      description: "要执行的多行命令序列 (与 'command' 互斥)"
    },
    mode: {
      type: "string",
      enum: ["sync", "async"],
      default: "sync",
      description: "执行模式: sync (同步阻塞), async (异步非阻塞)"
    },
    timeout: {
      type: "number",
      minimum: 1,
      default: 60,
      description: "命令执行的超时时间（秒）"
    },
    cwd: {
      type: "string",
      description: "命令执行的工作目录 (绝对路径)"
    },
    platform: {
      type: "string",
      enum: ["auto", "win32", "linux", "darwin"],
      default: "auto",
      description: "强制指定执行命令的操作系统环境"
    },
    safe_mode: {
      type: "boolean",
      default: true,
      description: "是否启用危险命令过滤"
    }
  },
  required: []
};

const dangerousCommandPatterns = [
  /^sudo\s+rm\s+-rf\s+\//,
  /^\s*rm\s+-rf\s+\//,
  /^sudo\s+chmod\s+(777|-R\s+777)\s+\//,
];

function isCommandDangerous(command: string): boolean {
  return dangerousCommandPatterns.some(pattern => pattern.test(command));
}

async function executeCommand(command: string, options: any): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const shell = options.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    const shellArg = options.platform === 'win32' ? '/c' : '-c';

    const spawnOptions: SpawnOptions = {
      cwd: options.cwd,
      env: process.env,
      shell: true,
      timeout: options.timeout * 1000 // 将秒转换为毫秒
    };

    const child = spawn(shell, [shellArg, command], spawnOptions);

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    child.on('error', (err) => {
      if ((err as any).code === 'ETIMEDOUT') {
        reject(new Error(`命令执行超时 (超过 ${options.timeout} 秒)`));
      } else {
        reject(err);
      }
    });
  });
}

export default async function (request: any) {
  try {
    const { command, commands, mode, timeout, cwd, platform: requestedPlatform, safe_mode } = request.params.arguments;

    if (!command && !commands) {
      throw new Error("必须提供 'command' 或 'commands' 参数之一。");
    }

    if (command && commands) {
      throw new Error("'command' 和 'commands' 参数不能同时提供。");
    }

    const osPlatform = requestedPlatform === 'auto' ? platform() : requestedPlatform;
    const options = {
      cwd: cwd || process.cwd(),
      timeout: timeout || 60,
      platform: osPlatform
    };

    const allCommands = command ? [command] : (commands || []);

    if (safe_mode) {
      for (const cmd of allCommands) {
        if (isCommandDangerous(cmd)) {
          throw new Error(`命令 "${cmd}" 被安全模式阻止。`);
        }
      }
    }

    if (mode === 'sync') {
      const results = [];
      for (const cmd of allCommands) {
        const { stdout, stderr, code } = await executeCommand(cmd, options);
        results.push({
          type: "text",
          text: JSON.stringify({ command: cmd, stdout, stderr, code }, null, 2)
        });
      }
      return { content: results };
    } else { // async mode
      for (const cmd of allCommands) {
        executeCommand(cmd, options).catch(error => {
          // 异步错误不会直接返回给用户，但会被框架的日志系统捕获
          console.error(`异步命令执行失败: ${cmd}`, error);
        });
      }
      return {
        content: [{
          type: "text",
          text: `已为 ${allCommands.length} 个命令启动异步执行。请检查系统日志以了解完成状态。`
        }]
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function destroy() {
  console.log("Destroy cli_tool tool");
}

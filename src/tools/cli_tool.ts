import { spawn } from 'child_process';
import { platform } from 'os';
import fs from 'fs';
import { cliLogFile } from '../config.js';


export const schema = {
  name: "cli_tool",
  description: "CLI executor with sync/async modes and timeout.",
  type: "object",
  properties: {
    command: { type: "string", description: "Single-line command content" },
    commands: {
      type: "array",
      items: { type: "string" },
      description: "Multi-line command sequence (mutually exclusive with 'command')"
    },
    mode: {
      type: "string",
      enum: ["sync", "async"],
      default: "sync",
      description: "Execution mode: sync - synchronous blocking, async - asynchronous non-blocking"
    },
    timeout: {
      type: "number",
      minimum: 1,
      default: 30,
      description: "Command timeout in seconds"
    },
    cwd: {
      type: "string",
      description: "Working directory (absolute or relative to build/)"
    },
    platform: {
      type: "string",
      enum: ["auto", "win32", "linux", "darwin"],
      default: "auto",
      description: "Force execution context (win32, linux)"
    },
    safe_mode: {
      type: "boolean",
      default: true,
      description: "Enable dangerous command filtering"
    }
  },
  required: []
};

const dangerousCommands = [
  'rm -rf /',
  'chmod 777 /*'
];

async function executeCommand(command: string, options: any): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const shell = options.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    const shellArg = options.platform === 'win32' ? '/c' : '-c';

    const child = spawn(shell, [shellArg, command], {
      cwd: options.cwd,
      env: process.env,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export default async function (request: any) {
  try {
    const { command, commands, mode, timeout, cwd, platform: requestedPlatform, safe_mode } = request.params.arguments;

    if (!command && !commands) {
      throw new Error("必须提供 'command' 或 'commands' 参数");
    }

    if (command && commands) {
      throw new Error("'command' 和 'commands' 参数不能同时提供");
    }

    const osPlatform = requestedPlatform === 'auto' ? platform() : requestedPlatform;
    const options = {
      cwd: cwd || process.cwd(),
      timeout: timeout || 30,
      platform: osPlatform,
      safe_mode: safe_mode !== false // 显式设置为false才禁用
    };

    if (safe_mode) {
      if (command && dangerousCommands.includes(command)) {
        throw new Error("该命令被安全模式阻止");
      }
      if (commands && commands.some(cmd => dangerousCommands.includes(cmd))) {
        throw new Error("存在命令被安全模式阻止");
      }
    }

    let allCommands = command ? [command] : commands;
    let results: any = [];

    if (mode === 'sync') {
      for (const cmd of allCommands) {
        const startTime = Date.now();
        const { stdout, stderr, code } = await executeCommand(cmd, options);
        const endTime = Date.now();
        const duration = endTime - startTime;

        const logMessage = `[${new Date().toISOString()}] Command: ${cmd}, Code: ${code}, Duration: ${duration}ms, Stdout: ${stdout}, Stderr: ${stderr}\n`;
        fs.appendFileSync(cliLogFile, logMessage, 'utf8');

        results.push({
          type: "text",
          text: JSON.stringify({ stdout, stderr, code }, null, 2)
        });
      }
    } else {
      // 异步模式
      for (const cmd of allCommands) {
        const startTime = Date.now();
        executeCommand(cmd, options)
          .then(({ stdout, stderr, code }) => {
            const endTime = Date.now();
            const duration = endTime - startTime;

            const logMessage = `[${new Date().toISOString()}] Command: ${cmd}, Code: ${code}, Duration: ${duration}ms, Stdout: ${stdout}, Stderr: ${stderr}\n`;
            fs.appendFileSync(cliLogFile, logMessage, 'utf8');

            results.push({
              type: "text",
              text: JSON.stringify({ stdout, stderr, code }, null, 2)
            });
          })
          .catch(err => {
            const endTime = Date.now();
            const duration = endTime - startTime;

            const logMessage = `[${new Date().toISOString()}] Command: ${cmd}, Error: ${err instanceof Error ? err.message : String(err)}, Duration: ${duration}ms\n`;
            fs.appendFileSync(cliLogFile, logMessage, 'utf8');

            results.push({
              type: "text",
              text: `Error: ${err instanceof Error ? err.message : String(err)}`
            });
          });
      }
      // 异步模式下立即返回，不等待命令完成
      return {
        content: [
          {
            type: "text",
            text: "异步命令已启动，请查看日志"
          }
        ]
      };
    }

    return {
      content: results,
      isError: false
    };

  } catch (error) {
    const logMessage = `[${new Date().toISOString()}] Error: ${error instanceof Error ? error.message : String(error)}\n`;
    fs.appendFileSync(cliLogFile, logMessage, 'utf8');
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

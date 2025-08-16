#!/usr/bin/env node
import dotenv from 'dotenv';
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  isInitializeRequest
} from "@modelcontextprotocol/sdk/types.js";
import { listResourcesHandler, readResourceHandler } from "./handler/ResourceHandler.js";
import { listToolsHandler, callToolHandler, loadTools } from "./handler/ToolHandler.js";
import { getPromptHandler, listPromptsHandler } from "./handler/PromptHandler.js";
import { LogService } from "./logService.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";

dotenv.config(); //加载环境变量文件
// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // LogService.log({
  //   ts: new Date().toISOString(),
  //   tool: 'system',
  //   args: {},
  //   stat: 'error',
  //   err: error.message,
  //   trace: error.stack,
  // });
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // LogService.log({
  //   ts: new Date().toISOString(),
  //   tool: 'system',
  //   args: {},
  //   stat: 'error',
  //   err: reason instanceof Error ? reason.message : String(reason),
  //   trace: reason instanceof Error ? reason.stack : undefined,
  // });
});

/**创建一个 MCP 服务器*/
async function main() {
  console.log('Starting ToolBox server...');
  try {
    // 加载所有工具
    console.log('Loading tools...');
    await loadTools();
    //创建服务器
    const server = new Server({ name: "ToolBox", version: "0.1.0" }, { capabilities: { resources: {}, tools: {}, prompts: {} } });
    // 设置请求处理程序
    server.setRequestHandler(ListResourcesRequestSchema, listResourcesHandler);
    server.setRequestHandler(ReadResourceRequestSchema, readResourceHandler);
    server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);
    server.setRequestHandler(CallToolRequestSchema, async (request: any) => await callToolHandler(request, "ai") as any);
    server.setRequestHandler(ListPromptsRequestSchema, listPromptsHandler);
    server.setRequestHandler(GetPromptRequestSchema, getPromptHandler);

    const seeProt = Number(process.env.SSEPORT);
    if (!isNaN(seeProt)) {
      const app = express();
      app.use(express.json());
      // 用于按会话 ID 存储传输的映射
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
      // 处理客户端到服务器通信的 POST 请求
      app.post('/mcp', async (req, res) => {
        // 检查现有的会话 ID
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transports[sessionId]) {
          // 重用现有传输
          transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // 新的初始化请求
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              // 按会话 ID 存储传输
              transports[sessionId] = transport;
            },
            // 默认情况下，DNS 重新绑定保护是禁用的，以实现向后兼容。如果此服务器在本地运行，
            // 请确保设置：
            // enableDnsRebindingProtection: true,
            // allowedHosts: ['127.0.0.1'],
          });
          // 关闭传输时进行清理
          transport.onclose = () => { if (transport.sessionId) delete transports[transport.sessionId]; };
          // 连接到 MCP 服务器
          await server.connect(transport);
        } else {
          // 无效请求
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }
        // 处理请求
        await transport.handleRequest(req, res, req.body);
      });
      // 可重用的 GET 和 DELETE 请求处理程序
      const handleSessionRequest = async (req: express.Request, res: express.Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      };
      // 处理通过 mcp 实现的服务器到客户端通知的 GET 请求
      app.get('/mcp', handleSessionRequest);
      // 处理会话终止的 DELETE 请求
      app.delete('/mcp', handleSessionRequest);
      app.listen(seeProt);
      console.log(`StreamableHttp server listening on http://localhost:${seeProt}/mcp`);
    } else {
      // 启动服务器
      console.log('Connecting to transport...');
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.log('ToolBox server started successfully');
    }

    // 记录启动日志
    LogService.log({
      ts: new Date().toISOString(),
      tool: 'system',
      args: {},
      stat: 'info',
      err: 'Server started successfully',
    });
  } catch (error) {
    console.error("Server startup error:", error);
    LogService.log({
      ts: new Date().toISOString(),
      tool: 'system',
      args: {},
      stat: 'error',
      err: error instanceof Error ? error.message : String(error),
      trace: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main()

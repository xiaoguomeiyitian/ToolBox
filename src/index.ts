#!/usr/bin/env node
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { listResourcesHandler, readResourceHandler } from "./handler/ResourceHandler.js";
import { listToolsHandler, callToolHandler, loadTools } from "./handler/ToolHandler.js";
import { getPromptHandler, listPromptsHandler } from "./handler/PromptHandler.js";
import { LogService } from "./logService.js";

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

// 优雅退出
function setupGracefulShutdown(transport: StdioServerTransport) {
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    try {
      transport.close();
      console.log('Server shutting down');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

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
      // 为了支持多个同时连接，我们使用一个查找对象，
      const transports: { [sessionId: string]: SSEServerTransport } = {};
      app.get("/sse", async (_: Request, res: Response) => {
        const sseTransport = new SSEServerTransport('/messages', res);
        transports[sseTransport.sessionId] = sseTransport;
        res.on("close", () => {
          delete transports[sseTransport.sessionId];
        });
        await server.connect(sseTransport);
      });
      app.post("/messages", async (req: Request, res: Response) => {
        const sessionId = req.query.sessionId as string;
        const sseTransport = transports[sessionId];
        if (sseTransport) {
          await sseTransport.handlePostMessage(req, res);
        } else {
          res.status(400).send('No transport found for sessionId');
        }
      });
      app.listen(seeProt);
      console.log(`SSE server listening on http://localhost:${seeProt}/sse`);
    } else {
      // 启动服务器
      console.log('Connecting to transport...');
      const transport = new StdioServerTransport();
      // 设置优雅退出
      setupGracefulShutdown(transport);
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

#!/usr/bin/env node

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

/**创建一个 MCP 服务器*/
const server = new Server({ name: "ToolBox", version: "0.1.0", }, { capabilities: { resources: {}, tools: {}, prompts: {}, } });
server.setRequestHandler(ListResourcesRequestSchema, listResourcesHandler);
server.setRequestHandler(ReadResourceRequestSchema, readResourceHandler);
server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);
server.setRequestHandler(CallToolRequestSchema, async (request) => await callToolHandler(request, "ai"));
server.setRequestHandler(ListPromptsRequestSchema, listPromptsHandler);
server.setRequestHandler(GetPromptRequestSchema, getPromptHandler);

/**使用 stdio 传输启动服务器。这允许服务器通过标准输入/输出流进行通信。*/
async function main() {
  await loadTools();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

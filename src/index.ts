#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

export const toolDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tool');
export const toolFiles = fs.readdirSync(toolDir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
//log目录
const logDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'log');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });
export const logFile = path.join(logDirectory, 'ToolBox.log');
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '', 'utf8');
//json目录
const jsonDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'json');
if (!fs.existsSync(jsonDirectory)) fs.mkdirSync(jsonDirectory, { recursive: true });
export const tasksFilePath = path.join(jsonDirectory, 'scheduled_tasks.json');
if (!fs.existsSync(tasksFilePath)) fs.writeFileSync(tasksFilePath, '[]', 'utf8');

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

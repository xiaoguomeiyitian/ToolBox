# ToolBox MCP Server 
[![GitHub Repository](https://img.shields.io/badge/Repo-ToolBox_MCP_Server-blue?logo=github)](https://github.com/xiaoguomeiyitian/ToolBox)

A versatile Model Context Protocol (MCP) server providing a collection of tools for various tasks.

This TypeScript-based server acts as a toolbox, offering functionalities ranging from note creation to data manipulation and system interaction. It showcases core MCP concepts by:

- Exposing tools that perform specific actions.
- Dynamically generating resources based on tool execution.
- Providing prompts for data summarization and other tasks.

[中文文档](README_ZH.md)

[Tool Specifications](TOOL.md)

## Features

### Tools

View the complete tool specifications and detailed documentation: [TOOL.md](TOOL.md)

### Resources

Resources are generated dynamically as a result of tool execution. For example, the `create_note` tool creates a note resource that can be accessed via its URI.

### Prompts

- `summarize_notes`: Generates summaries of the notes created using the `create_note` tool.

## Development Guide

### Adding New Tools
View the complete development guide: [prompt.md](prompt.md)

Key steps summary:
1. Create a tool file (my_tool.ts)
2. Define the parameter schema (schema object)
3. Implement the tool logic (default function)
4. Compile and test the tool

[Detailed steps](prompt.md) include best practices for parameter validation, error handling, etc.

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## Marketplace Submission

![ToolBox Logo](logo/ToolBox_logo.png)
*A Seamless Integrated Automation Toolkit for Claude Desktop*

## Installation

To integrate with the Claude Desktop application, add the following server configuration to:

-   macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
-   Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
// Cline MCP server configuration file
{
  "command": "node",
  "args": [
    "--inspect=9229",
    "/MCP/ToolBox/build/index.js"
  ],
  "env": {
    "MONGO_URI": "mongodb://user:password@host:port/db",
    "MONGO_INDEX_OPS": "true",
    "REDIS_URI": "redis://:password@host:port",
    "SSH_server1_URI": "username:password@host:port"
  },
  "disabled": false,
  "autoApprove": []
}
```

## Core Values

🚀 **Enterprise-Grade Automation**  
Leveraging package.json configuration, providing:
- Global CLI tool installation (`tbx` command)
- Workflow scheduling engine (node-cron integration)
- Multi-platform support (Windows/macOS)
- Hybrid cloud deployment capabilities (MongoDB/Redis/SSH)

🔧 **Developer-Friendly**  
- Strongly-typed TypeScript implementation
- Real-time debugging support (--inspect flag)
- VSCode debugging configuration template

## Debugging

Debugging MCP servers can be challenging due to their stdio communication. Here are a few approaches:

🚧 Disclaimers

### Sensitive Data
DO NOT CONFIGURE CONTAINERS WITH SENSITIVE DATA. This includes API keys, database passwords, etc.

Any sensitive data exchanged with the LLM is inherently compromised, unless the LLM is running on your local machine.

### Legal Liability ⚠️
- ⚠️ The tool is provided "as-is" under MIT License without warranties  
- ⚠️ Developer not liable for direct/indirect damages  
- ⚠️ Users bear all risks from improper container configurations  
- ⚠️ Any illegal or destructive usage is strictly prohibited  
- ⚠️ See [LICENSE](LICENSE) for full terms   

1.  **Node.js Inspector:** Launch the server with the `--inspect=9229` flag:

```bash
node --inspect=9229 build/index.js
```

Then, connect to the server using Chrome DevTools by navigating to `chrome://inspect`.

2.  **MCP Inspector:** Utilize the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), a dedicated debugging tool accessible via the `inspector` npm script:

3.  **VSCode Debugging**

To debug with VSCode, create a `.vscode/launch.json` file with the following configuration:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "attach",
            "name": "ToolBox",
            "address": "localhost",
            "port": 9229,
            "localRoot": "${workspaceFolder}"
        }
    ]
}
```

Then, launch the server with the `--inspect=9229` flag and attach the VSCode debugger.

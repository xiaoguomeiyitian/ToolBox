# ToolBox MCP Server 
[![GitHub Release](https://img.shields.io/github/v/release/xiaoguomeiyitian/ToolBox)](https://github.com/xiaoguomeiyitian/ToolBox/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An AI-powered automation tool development platform, providing:

🧩 Modular Architecture - Tool hot-reloading via the `src/tools` directory
🤖 AI Assistance - AI engine for natural language to tool template conversion
🚀 Enterprise-Grade Capabilities - Integration of production environment services such as MongoDB/Redis/SSH
🔄 Real-time Updates - Zero-downtime deployment via `buildReload_tool`

```mermaid
graph LR
    A[Developer] -->|Create| B(Tool Template)
    B --> C{AI Verification}
    C -->|Pass| D[Automatic Loading]
    C -->|Fail| E[Human Review]
    D --> F[API Exposure]
    F --> G[Client Invocation]
    style C fill:#4CAF50,stroke:#333
```

[中文文档](README_ZH.md)

## Contributing
[Contributing Guidelines (English)](CONTRIBUTING_EN.md)
[Contributing Guidelines (中文)](CONTRIBUTING_ZH.md)

[Tool Specifications](TOOL.md)

## Features

### Tools

View the complete tool specifications and detailed documentation: [TOOL.md](TOOL.md)

### Resources

Resources are generated dynamically as a result of tool execution. For example, the `create_note` tool creates a note resource that can be accessed via its URI.

### Workflow Tool

The `workflow_tool` is a powerful tool for orchestrating complex workflows by chaining together multiple tools. It supports:

- **Serial and Parallel Execution:** Execute tools in a sequential or parallel manner.
- **Transaction Management:** Manage transactions with compensation mechanisms for error handling.
- **Detailed Reporting:** Generate detailed reports on workflow execution, including the status, execution time, and results of each step.
- **Customizable Output:** Specify an output file to save the workflow execution report.

### Prompts

- `summarize_notes`: Generates summaries of the notes created using the `create_note` tool.

## Development Guide

### Adding New Tools
```mermaid
graph TD
    A[Create Tool Template] --> B{AI Automatic Verification}
    B -->|Schema Validation| C[Generate Test Cases]
    B -->|Risk Exists| D[Human Review]
    C --> E[Unit Testing]
    D -->|Approve| E
    E --> F[Security Scanning]
    F --> G[Build Integration]
    G --> H[Version Release]
    style A fill:#f9f,stroke:#333
    style H fill:#4CAF50,stroke:#333
```

**Detailed Development Process**
1. Template Creation: Create a new tool file in the `src/tools/` directory
2. AI Verification: Automatically check the parameter Schema compliance
3. Test Generation: Generate test cases based on the function description
4. Security Review: Static code analysis and dependency checking
5. Continuous Integration: Automated deployment via GitHub Actions

View the complete development guide: [prompt.md](prompt.md)
Refer to existing implementations: [Tool Examples](src/tools/)

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
- Hot-reloading mechanism:
  ```mermaid
  graph LR
    A[Code Modification] --> B[buildReload_tool]
    B --> C[Automatic Compilation]
    C --> D[Security Verification]
    D --> E[Tool Reloading]
    style B fill:#4CAF50,stroke:#333
  ```
  Implemented by calling `buildReload_tool`:
  - Zero-downtime updates
  - Automatic dependency tree parsing
  - Version compatibility check
  - Sandbox environment testing

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

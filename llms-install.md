# ToolBox MCP Automated Installation Guide

## System Requirements
- Node.js v18+
- npm v9+
- MCP Inspector (optional)

## One-Click Installation Process
```bash
# Clone the repository
git clone https://github.com/xiaoguomeiyitian/ToolBox.git

# Install dependencies (Chinese users are recommended to use mirrors)
npm install --registry=https://registry.npmmirror.com

# Build the production version
npm run build

# Verify installation
node ./build/index.js --health-check
```

## Key Configuration
Replace the following placeholders in the Claude/Cline configuration file:
```json
"env": {
  "MONGO_URI": "mongodb://user:password@host:port/db",
  "MONGO_INDEX_OPS": "true",
  "REDIS_URI": "redis://:password@host:port",
  "SSH_server1_URI": "username:password@host:port"
}
```

For configuring a `streamableHttp` type MCP server, configure the current MCP server in the Cline plugin as follows:
```json
{
  "mcpServers": {
    "ToolBox": {
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "type": "streamableHttp",
      "url": " http://localhost:3001/mcp"
    }
  }
}
```

## Installation Verification
```bash
# Check service status
curl -X POST http://localhost:${MCP_PORT}/health

# Test tool list query
cline> use_mcp_tool --server ToolBox --tool list_tools

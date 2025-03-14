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
Replace the following placeholders in the Claude configuration file:
```json
"env": {
  "MONGO_URI": "mongodb://user:password@host:port/db",
  "REDIS_URI": "redis://:password@host:port"
}
```

## Installation Verification
```bash
# Check service status
curl -X POST http://localhost:${MCP_PORT}/health

# Test tool list query
cline> use_mcp_tool --server ToolBox --tool list_tools

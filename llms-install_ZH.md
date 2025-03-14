# ToolBox MCP 自动化安装指南

## 系统要求
- Node.js v18+
- npm v9+
- MCP Inspector（可选）

## 一键安装流程
```bash
# 克隆仓库
git clone https://github.com/xiaoguomeiyitian/ToolBox.git

# 安装依赖（中国用户建议使用镜像）
npm install --registry=https://registry.npmmirror.com

# 构建生产版本
npm run build

# 验证安装
node ./build/index.js --health-check
```

## 密钥配置
在Claude/Cline配置文件中替换以下占位符：
```json
"env": {
  "MONGO_URI": "mongodb://user:password@host:port/db",
  "MONGO_INDEX_OPS": "true",
  "REDIS_URI": "redis://:password@host:port",
  "SSH_server1_URI": "username:password@host:port"
}
```

## 安装验证
```bash
# 检查服务状态
curl -X POST http://localhost:${MCP_PORT}/health

# 测试工具列表查询
cline> use_mcp_tool --server ToolBox --tool list_tools

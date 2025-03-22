# ToolBox MCP 服务器
[![GitHub Release](https://img.shields.io/github/v/release/xiaoguomeiyitian/ToolBox)](https://github.com/xiaoguomeiyitian/ToolBox/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一个 AI 驱动的自动化工具开发平台，提供：

🧩 模块化架构 - 通过 `src/tools` 目录进行工具热重载
🤖 AI 辅助 - 用于自然语言到工具模板转换的 AI 引擎
🚀 企业级能力 - 生产环境服务集成，例如 MongoDB/Redis/SSH
🔄 实时更新 - 通过 `buildReload_tool` 实现零停机部署

```mermaid
graph LR
    A[开发者] -->|创建| B(工具模板)
    B --> C{AI 验证}
    C -->|通过| D[自动加载]
    C -->|失败| E[人工审核]
    D --> F[API 暴露]
    F --> G[客户端调用]
    style C fill:#4CAF50,stroke:#333
```

[English Document](README.md)

## 贡献
[贡献指南 (English)](CONTRIBUTING.md)
[贡献指南 (中文)](CONTRIBUTING_ZH.md)

[工具规范](TOOL_ZH.md)

## 功能

### 工具

查看完整的工具规范和详细文档：[TOOL_ZH.md](TOOL_ZH.md)

### 资源

资源是工具执行的动态结果。 例如，`create_note` 工具创建一个可以通过其 URI 访问的 note 资源。

### 工作流工具

`workflow_tool` 是一个强大的工具，用于通过将多个工具链接在一起来编排复杂的工作流程。 它支持：

- **串行和并行执行：** 以顺序或并行方式执行工具。
- **事务管理：** 使用补偿机制管理事务以进行错误处理。
- **详细报告：** 生成有关工作流执行的详细报告，包括每个步骤的状态、执行时间和结果。
- **可自定义的输出：** 指定一个输出文件以保存工作流执行报告。

### 提示

- `summarize_notes`: 生成使用 `create_note` 工具创建的笔记的摘要。

## 开发指南

### 添加新工具
```mermaid
graph TD
    A[创建工具模板] --> B{AI 自动验证}
    B -->|架构验证| C[生成测试用例]
    B -->|存在风险| D[人工审核]
    C --> E[单元测试]
    D -->|批准| E
    E --> F[安全扫描]
    F --> G[构建集成]
    G --> H[版本发布]
    style A fill:#f9f,stroke:#333
    style H fill:#4CAF50,stroke:#333
```

**详细开发过程**
1. 模板创建：在 `src/tools/` 目录中创建一个新的工具文件
2. AI 验证：自动检查参数 Schema 合规性
3. 测试生成：根据函数描述生成测试用例
4. 安全审查：静态代码分析和依赖项检查
5. 持续集成：通过 GitHub Actions 自动部署

查看完整的开发指南：[prompt.md](prompt.md)
参考现有实现：[工具示例](src/tools/)

## 开发

安装依赖项：

```bash
npm install
```

构建服务器：

```bash
npm run build
```

对于具有自动重建功能的开发：

```bash
npm run watch
```

## 市场提交

![ToolBox Logo](logo/ToolBox_logo.png)
*Claude Desktop 的无缝集成自动化工具包*

## 安装

要与 Claude Desktop 应用程序集成，请将以下服务器配置添加到：

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
// Cline MCP 服务器配置文件
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
    "SSH_server1_URI": "username:password@host:port",
    "GEMINI_API_KEY":"GEMINI_API_KEY",
  },
  "disabled": false,
  "autoApprove": []
}
```

## 核心价值

🚀 **企业级自动化**
利用 package.json 配置，提供：
- 全局 CLI 工具安装 (`tbx` 命令)
- 工作流调度引擎
- 多平台支持 (Windows/macOS)
- 混合云部署能力 (MongoDB/Redis/SSH)

🔧 **开发者友好**
- 强类型 TypeScript 实现
- 实时调试支持 (--inspect flag)
- VSCode 调试配置模板
- 热重载机制：
  ```mermaid
  graph LR
    A[代码修改] --> B[buildReload_tool]
    B --> C[自动编译]
    C --> D[安全验证]
    D --> E[工具重载]
    style B fill:#4CAF50,stroke:#333
  ```
  通过调用 `buildReload_tool` 实现：
  - 零停机更新
  - 自动依赖树解析
  - 版本兼容性检查
  - 沙盒环境测试

## 调试

由于 MCP 服务器的 stdio 通信，调试可能具有挑战性。 以下是一些方法：

🚧 免责声明

### 敏感数据
请勿使用敏感数据配置容器。 这包括 API 密钥、数据库密码等。

与 LLM 交换的任何敏感数据本质上都是有风险的，除非 LLM 在您的本地计算机上运行。

### 法律责任 ⚠️
- ⚠️ 该工具在 MIT 许可下按“原样”提供，不提供任何保证
- ⚠️ 开发者不对直接/间接损害负责
- ⚠️ 用户承担因不正确的容器配置而产生的所有风险
- ⚠️ 用户承担因不正确的容器配置而产生的所有风险
- ⚠️ 严禁任何非法或破坏性使用
- ⚠️ 有关完整条款，请参见 [LICENSE](LICENSE)

1. **Node.js 检查器：** 使用 `--inspect=9229` 标志启动服务器：

```bash
node --inspect=9229 build/index.js
```

然后，通过导航到 `chrome://inspect`，使用 Chrome DevTools 连接到服务器。

2. **MCP 检查器：** 利用 [MCP 检查器](https://github.com/modelcontextprotocol/inspector)，这是一个可通过 `inspector` npm 脚本访问的专用调试工具：

3. **VSCode 调试**

要使用 VSCode 进行调试，请创建一个包含以下配置的 `.vscode/launch.json` 文件：

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

然后，使用 `--inspect=9229` 标志启动服务器并附加 VSCode 调试器。

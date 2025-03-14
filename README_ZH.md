# ToolBox MCP 服务器

一个多功能的 Model Context Protocol (MCP) 服务器，提供了一系列用于各种任务的工具。

这个基于 TypeScript 编写的服务器充当一个工具箱，提供从笔记创建到数据操作和系统交互的功能。它通过以下方式展示了核心 MCP 概念：

- 公开执行特定操作的工具。
- 根据工具执行动态生成资源。
- 提供用于数据汇总和其他任务的提示。

[英文文档](README.md)

[工具](TOOL_ZH.md)

## 特性

### 工具

此服务器提供了一组不同的工具：

- `create_note`: 创建和存储简单的文本笔记。
    - 输入:
        - `title` (string): 笔记标题
        - `content` (string): 笔记文本内容
- `compress_tool`: 压缩和提取 zip、tar 和 tar.gz 格式的文件。
    - 输入:
        - `action` (string): 操作类型: 压缩或提取
        - `sourcePath` (string): 源文件/目录的绝对路径
        - `destinationPath` (string): 目标文件/目录的绝对路径
        - `format` (string): 压缩格式: zip, tar, tar.gz
- `mongo_tool`: 执行针对 MongoDB 数据库的查询。
    - 输入:
        - `where` (string): JSON 字符串格式的查询条件。例如: {\"age\": {\"$gt\": 18}} 查找 18 岁以上的用户。
        - `dbName` (string): 要查询的 MongoDB 数据库的名称。
        - `collectionName` (string): 要查询的 MongoDB 集合的名称。
        - `queryType` (string, optional): 要执行的 MongoDB 查询的类型。
        - `data` (string, optional): 要插入的 JSON 字符串格式的数据。insertOne 和 insertMany 操作需要。
        - `updateOperators` (string, optional): JSON 字符串格式的更新运算符。updateOne 和 updateMany 操作需要。
- `redis_tool`: 与 Redis 数据存储交互。
    - 输入:
        - `command` (string): 要执行的 Redis 命令。
        - `args` (string, optional): JSON 字符串格式的 Redis 命令的参数。
- `schedule_tool`: 调度任务和提醒。
    - 输入:
        - `action` (string): 操作类型
        - `time` (string): 时间格式: weekly@EEE@HH:mm, monthly@DD@HH:mm, now+Nm (N 分钟后), now+Ns (N 秒后), once@YYYY-MM-DD HH:mm, once@HH:mm
        - `message` (string): 提醒消息内容
        - `id` (string, optional): 任务 ID (取消时需要)
        - `tool_name` (string, optional): 要执行的工具的名称
        - `tool_args` (object, optional): 工具参数
- `sftp_tool`: 将文件上传和下载到/从 SSH 服务器。
    - 输入:
        - `serverName` (string): 要连接的 SSH 服务器的名称。
        - `action` (string): 要执行的操作: 'upload' 或 'download'。
        - `localPath` (string): 本地文件路径。需要绝对路径。
        - `remotePath` (string): 远程文件路径。
- `ssh_tool`: 在 SSH 服务器上执行命令。
    - 输入:
        - `serverName` (string): 要连接的 SSH 服务器的名称。
        - `command` (string): 要在 SSH 服务器上执行的命令。
- `time_tool`: 检索当前时间。
    - 输入:
        - None

### 资源

资源是作为工具执行的结果动态生成的。例如，`create_note` 工具创建一个可以通过其 URI 访问的笔记资源。

### 提示

- `summarize_notes`: 生成使用 `create_note` 工具创建的笔记的摘要。

## 添加新工具

要使用您自己的工具扩展此 MCP 服务器：

1.  在 `src/tool/` 目录中创建一个新的 TypeScript 文件。
2.  实现您的工具，确保它导出以下内容：
    - 一个 `schema` 对象，用于定义工具的名称、描述、输入参数及其类型。
    - 一个 `default` 异步函数，该函数根据提供的输入执行工具的逻辑。

```typescript
/** time_tool 工具的参数列表 */
export const schema = {
    name: "time_tool",
    description: "Get current time",
    type: "object",
    properties: {},
    required: [],
};

export default async (request: any) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Current time: ${currentTime}`,
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting time: ${error.message}`,
                },
            ],
            isError: true
        };
    }
};
```

## 开发

安装依赖项：

```bash
npm install
```

构建服务器：

```bash
npm run build
```

用于自动重建的开发：

```bash
npm run watch
```

## 安装

要与 Claude Desktop 应用程序集成，请将以下服务器配置添加到：

-   macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
-   Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "command": "node",
  "args": [
    "--inspect=9229",
    "e:/MCP/ToolBox/build/index.js"
  ],
  "env": {
    "MONGO_URI": "",
    "MONGO_INDEX_OPS": "true",
    "REDIS_URI": "",
    "SSH_server1_URI": ""
  },
  "disabled": false,
  "autoApprove": []
}
```

## 调试

由于 MCP 服务器的 stdio 通信，调试 MCP 服务器可能具有挑战性。以下是一些方法：

1.  **Node.js 检查器：** 使用 `--inspect=9229` 标志启动服务器：

```bash
node --inspect=9229 build/index.js
```

然后，通过导航到 `chrome://inspect`，使用 Chrome DevTools 连接到服务器。

2.  **MCP 检查器：** 利用 [MCP 检查器](https://github.com/modelcontextprotocol/inspector)，这是一个通过 `inspector` npm 脚本访问的专用调试工具：

**VSCode 调试**

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

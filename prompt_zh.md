# 如何添加一个新工具

以下是添加新工具的详细步骤和注意事项：

1.  **创建工具文件：** 在 `src/tools/` 目录下创建一个新的 TypeScript 文件 (例如: `my_tool.ts`)。

2.  **定义参数列表 (schema)：**
    *   在该文件中，导出一个 `schema` 对象，用于描述工具的参数。
    *   `schema` 对象必须包含 `name` (工具名称), `description` (工具描述), `type` (必须是 `"object"`), `properties` (参数定义), `required` (必需参数列表) 和 `outputSchema` (输出格式定义) 属性。
    *   `properties` 对象中的每个参数定义必须包含 `type` (参数类型，例如 `"string"`, `"number"`, `"boolean"`) 和 `description` (参数描述) 属性。
    *   如果参数是枚举类型，可以使用 `enum` 属性指定枚举值。
    *   `outputSchema` 用于定义工具输出的格式，包括 `content` (内容数组) 和 `isError` (是否出错) 属性。
    *   **注意事项：**
        *   `name` 必须是唯一的，不能与其他工具重复。
        *   `description` 应该清晰简洁，描述工具的功能。
        *   `required` 数组应该包含所有必需的参数，避免工具运行时出错。
        *   `outputSchema` 应该与 `default` 函数的返回值一致，确保输出格式正确。

3.  **实现工具逻辑 (default 函数)：**
    *   同样在该文件中，导出一个 `default` 函数，用于实现工具的具体功能。
    *   `default` 函数必须接收一个 `request` 参数，该参数包含请求的信息，例如参数。
    *   `default` 函数必须返回一个 Promise，resolve 的值应该是一个对象，包含 `content` 属性，`content` 属性是一个数组，包含一个对象，该对象包含 `type` (内容类型，例如 `"text"`) 和 `text` (内容文本) 属性。
    *   **注意事项：**
        *   `request.params.arguments` 对象包含客户端传递的参数。
        *   应该对参数进行验证，确保参数的类型和值符合预期。
    *   如果工具执行出错，应该 reject Promise，并返回一个包含 `isError: true` 的对象。
        *   `content` 数组可以包含多个对象，用于返回多个结果。
    *   工具之间可以通过 `callToolHandler` 函数调用其他工具:
        ```typescript
        await callToolHandler(
          { 
            params: { 
              name: "target_tool_name",
              arguments: { key: "value" }
            }
          },
          "caller_identifier"
        );
        ```
        - 第一个参数: 包含工具名称和参数的请求对象
        - 第二个参数: 调用方唯一标识符，用于日志追踪
        - 被调用工具会记录调用链信息：
          ```json
          {
            "caller": "caller_identifier",
            "tool": "target_tool_name",
            "tid": "Associated task ID (optional)"
          }
          ```
        - 调用链标识符应遵循 `<父工具名>_<唯一后缀>` 格式，例如：
          ```typescript
          // Scheduled task call example
          `schedule_tool_${task.id}`
          ```
        - 多级调用会自动形成完整调用链，可通过日志字段追溯完整执行路径

4.  **创建测试文件：**
    *   在 `test/tools/` 目录下创建一个新的 TypeScript 文件 (例如: `my_tool.test.ts`)。

5. **编写测试用例：**
   - 参考示例：`test/tools/time_tool.test.ts`
   - 必须包含：
     - 参数校验测试（验证必填参数缺失场景）
     - 外部依赖Mock（如文件系统操作）
   - 执行方式：
     - 全量测试：`npm run test`
     - 单用例测试：`npm run test -- test/tools/TestFileName`

6.  **运行测试用例：**
    *   使用 `npm run test` 命令运行所有测试用例，或者使用 `npm run test -- test/tools/TestFileName` 命令运行单个测试用例。

7.  **验证测试结果：**
    *   检查测试结果，确保所有测试用例都通过。如测试失败，应据此反推工具实现中的缺陷并迭代修改

8.  **配置动态加载：**
    *   `tools` 目录下的文件会被动态加载。请确保工具文件符合以下结构：
        ```typescript
        import { ToolSchema } from '@modelcontextprotocol/sdk';
        
        export const schema: ToolSchema = {
          name: '你的工具名称',
          description: '工具功能描述',
          type: 'object',
          properties: {
            // 添加参数定义
            param1: {
              type: 'string',
              description: '参数描述',
              enum: ['选项1', '选项2'] // 枚举示例
            }
          },
          required: ['param1'],
          outputSchema: {
            type: 'object',
            properties: {
              content: { /*...*/ },
              isError: { /*...*/ }
            }
          }
        };
        ```
    *   无需修改 `src/index.ts` 或 `src/handler/ToolHandler.ts`

9.  **编译项目：**
    *   运行构建命令编译所有文件：
        ```bash
        npm run build
        ```
    *   编译前请确保没有语法错误

10. **重启 MCP 服务器：**
    *   编译完成后需重启 MCP 服务器使新工具生效
    *   请手动重启 MCP 服务器

11. **测试工具功能：**
    *   编译完成后，可通过 MCP 客户端调用工具进行功能验证
    *   使用 `listToolsHandler` 可列出所有已加载工具，确认新工具存在

## 日志规范

**日志文件路径：** `./log/ToolBox.log`

### 统一日志处理机制

系统通过 callToolHandler 实现集中式日志记录：

1. **自动日志记录**
- 所有工具调用都会通过 `callToolHandler` 自动记录日志，无需手动添加日志代码
- 记录内容包括：执行时间、参数、耗时、状态（成功/错误）
- 错误日志会自动捕获错误信息和堆栈跟踪

2. **日志记录范围**
- 仅需在以下场景主动调用 `callToolHandler`：
  - 需要调用其他工具时（工具链场景）
  - 需要建立调用链追踪时
- 常规工具执行无需也不应该手动调用 `callToolHandler` 记录日志

3. **标准化日志结构**
| 字段    | 数据来源                | 示例值                      |
|--------|-----------------------|---------------------------|
| ts     | ISO 8601 时间戳        | "2025-03-15T02:29:40.123Z" |
| tool   | 请求工具名称            | "docker_tool"             |
| caller | 调用链标识符            | "schedule_tool_123"       |
| args   | 执行参数                | { "image": "nginx" }      |
| stat   | success/error          | "success"                 |
| cost   | 执行耗时(毫秒)          | 158                       |
| err    | 错误信息                | "Invalid image format"    |
| trace  | 错误堆栈                | Error: Invalid image format... |

4. **调用链追踪**
- 调用方标识符遵循 `<父工具名>_<唯一后缀>` 格式
- 多级调用自动形成可追溯执行路径

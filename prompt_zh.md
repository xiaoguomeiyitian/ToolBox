# 如何添加一个新工具

以下是添加新工具的详细步骤和注意事项：

1.  **创建工具文件：** 在 `src/tool/` 目录下创建一个新的 TypeScript 文件 (例如: `my_tool.ts`)。

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

4.  **动态加载：**
    *   `tool` 目录下的文件会被动态加载，因此添加新的工具文件后，无需修改 `src/index.ts` 和 `src/handler/ToolHandler.ts` 文件。

5.  **编译文件：**
    *   添加或修改代码后，需要编译文件。可以使用 `npm run build` 命令编译文件。

6.  **测试工具：**
    *   添加工具后，可以通过 MCP 客户端调用该工具，测试其功能是否正常。
    *   可以使用 `listToolsHandler` 列出所有工具，确认新工具已经成功加载。

7.  **重启 MCP 服务器：**
    *   编译文件后，需要重启 MCP 服务器，才能使新的工具生效。
    *   请手动重启 MCP 服务器。

## 日志规范

**日志文件路径：** `./log/ToolBox.log`

关键日志字段说明（原始→优化后）：
| 原始字段       | 优化字段        | 描述说明                    |
|----------------|----------------|---------------------------|
| timestamp      | ts             | 事件时间戳(ISO 8601格式)   |
| params         | args           | 工具执行参数                |
| status         | stat           | 执行状态(success/error)    |
| duration       | cost           | 操作耗时(毫秒)             |
| error          | err            | 错误信息(若有)             |
| stack          | trace          | 错误堆栈(若有)             |
| caller         | caller          | 调用链源头标识            |
| tool           | tool          | 工具名称         |

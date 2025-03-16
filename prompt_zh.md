# Toolbox 使用指南

## 如何添加新工具

以下是添加新工具的详细步骤和注意事项：

1.  **创建工具文件：** 在 `src/tools/` 目录下创建一个新的 TypeScript 文件（例如，`my_tool.ts`）。

2.  **定义参数列表（schema）：**
    *   在此文件中，导出一个 `schema` 对象来描述工具的参数。
    *   `schema` 对象必须包含以下属性：`name`（工具名称）、`description`（工具描述）、`type`（必须为 `"object"`）、`properties`（参数定义）、`required`（必需参数列表）和 `outputSchema`（输出格式定义）。
    *   `properties` 对象中的每个参数定义必须包含 `type`（参数类型，例如 `"string"`、`"number"`、`"boolean"`）和 `description`（参数描述）属性。
    *   如果参数是枚举类型，可以使用 `enum` 属性来指定枚举值。
    *   `outputSchema` 用于定义工具的输出格式，包括 `content`（内容数组）和 `isError`（是否发生错误）属性。
    *   **注意事项：**
        *   `name` 必须唯一，不能与其他工具重复。
        *   `description` 应该清晰简洁，描述工具的功能。
        *   `required` 数组应包含所有必需参数，以避免工具执行期间出错。
        *   `outputSchema` 应该与 `default` 函数的返回值一致，以确保输出格式正确。

3.  **实现工具逻辑（default 函数）：**
    *   同样在此文件中，导出一个 `default` 函数来实现工具的特定功能。
    *   `default` 函数必须接收一个 `request` 参数，其中包含请求信息，例如参数。
    *   `default` 函数必须返回一个 Promise，并且 resolved 的值应该是一个包含 `content` 属性的对象。`content` 属性是一个包含对象的数组，该对象包含 `type`（内容类型，例如 `"text"`）和 `text`（内容文本）属性。`text` 属性应该是一个使用 `JSON.stringify(results, null, 2)` 格式化的 JSON 字符串。
    *   为了避免自动工具重新加载期间的内存泄漏，添加一个 destroy 函数。
    *   **Destroy 函数：**
        *   在工具文件中，导出一个 `destroy` 函数来释放内存、停止计时器、断开连接等。
        *   系统会在重新加载工具之前自动调用此函数。
    *   **注意事项：**
        *   `request.params.arguments` 对象包含客户端传递的参数。
        *   应该验证参数，以确保参数的类型和值符合预期。
        *   如果在工具执行期间发生错误，应该拒绝 Promise 并返回一个包含 `isError: true` 的对象。
        *   `content` 数组可以包含多个对象以返回多个结果。
        *   工具可以通过 `callToolHandler` 函数调用其他工具：

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
        *   **注意事项：**
            *   仅在需要形成工具调用链时才主动使用 `callToolHandler`。
            *   常规工具执行日志由系统自动记录，无需手动添加。
            *   错误处理不需要，也不应该调用 `callToolHandler` 进行日志记录。
            *   第一个参数：一个包含工具名称和参数的请求对象。
            *   第二个参数：调用者的唯一标识符，用于日志跟踪。
            *   被调用的工具将记录调用链信息：

                ```json
                {
                  "caller": "caller_identifier",
                  "tool": "target_tool_name",
                  "tid": "关联任务 ID（可选）"
                }
                ```
            *   调用链标识符应遵循 `<parent_tool>_<unique_suffix>` 格式，例如：

                ```typescript
                `schedule_tool_${task.id}`
                ```
            *   多级调用将自动形成完整的调用链，并且可以通过日志字段跟踪完整的执行路径。

4.  **工具动态加载：**
    *   `tools` 目录中的文件是动态加载的。无需修改 `src/index.ts` 或 `src/handler/ToolHandler.ts`。

5. **自动构建和重新加载：**
    # 通过 MCP 客户端执行 buildReload_tool
    这会自动执行：
    - 编译源代码
    - 重新加载所有工具
    - 验证工具注册

6. **测试工具：**
    添加新工具代码后，直接调用 MCP 服务器的 `buildReload_tool` 来编译和加载新工具。如果执行结果为成功，您可以立即调用新添加的 MCP 服务器工具进行测试，从而实现自动化开发和测试。如果出现测试问题，请修复问题，重新调用 MCP 服务器的 `buildReload_tool` 来编译和加载，然后再次测试。
    # 完整的开发周期示例：
    # 1. 创建新工具后
    调用 MCP工具 buildReload_tool
    # 2. 直接测试新工具
    直接调用 MCP工具 your_new_tool --args '{"param1":"value1"}'
    # 3. 根据测试结果修复并重新加载

## 日志规范

**日志文件路径：** `./log/ToolBox.log`

### 统一日志处理机制

系统通过 callToolHandler 实现集中式日志记录：

1.  **自动日志记录**
    *   所有工具调用都通过 `callToolHandler` 自动记录，无需手动添加日志代码。
    *   记录的信息包括：执行时间、参数、持续时间和状态（成功/错误）。
    *   错误日志自动捕获错误消息和堆栈跟踪。
2.  **调用链跟踪**
    *   调用者标识符遵循 `<parent_tool>_<unique_suffix>` 格式。
    *   多级调用自动形成可跟踪的执行路径。

3.  **标准化日志结构**

    | 字段  | 来源                   | 示例                         |
    | ------ | ------------------------ | ------------------------------- |
    | ts     | ISO 8601 时间戳       | "2025-03-15T02:29:40.123Z"    |
    | tool   | 请求工具名称        | "docker\_tool"                 |
    | caller | 调用链标识符    | "schedule\_tool\_123"           |
    | args   | 执行参数       | { "image": "nginx" }            |
    | stat   | success/error           | "success"                     |
    | cost   | 执行持续时间 (ms) | 158                           |
    | err    | 错误消息            | "Invalid image format"        |
    | trace  | 错误堆栈跟踪        | Error: Invalid image format... |

## 错误处理最佳实践

**使用 try-catch 包装关键代码：**

    ```typescript
    try {
      // 关键操作
    } catch (error) {
      // 处理错误
      throw new Error(`Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    ```

**工具开发示例：**

```typescript
// 定义参数 schema
export const schema = {
  name: "hello_world",
  description: "一个简单的 Hello World 工具，返回问候消息",
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "要问候的名字"
    },
    language: {
      type: "string",
      enum: ["en", "zh", "fr"],
      description: "问候语语言（en：英语，zh：中文，fr：法语）"
    }
  },
  required: ["name"],
  outputSchema: {
    type: "object",
    properties: {
      content: {
        type: "array",
        items: {
          type: { type: "string" },
          text: { type: "string" }
        }
      }
    }
  }
};

// 实现工具逻辑
export default async function(request: any) {
  try {
    const { name, language = "en" } = request.params.arguments;

    // 参数验证
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("name 参数必须是非空字符串");
    }

    // 根据语言生成问候语
    let greeting;
    switch (language) {
      case "zh":
        greeting = `你好，${name}！`;
        break;
      case "fr":
        greeting = `Bonjour, ${name}!`;
        break;
      case "en":
      default:
        greeting = `Hello, ${name}!`;
        break;
    }

    // 返回结果
    return {
      content: [
        {
          type: "text",
          text: greeting
        }
      ]
    };
  } catch (error) {
    // 错误处理
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// Destroy 函数
export async function destroy() {
  // 释放资源、停止计时器、断开连接等
  console.log("Destroy hello_world tool");
}
```

**工具调用链示例：**

```typescript
import { callToolHandler } from '../handler/ToolHandler.js';

export default async function(request: any) {
  try {
    const { city } = request.params.arguments;

    // 调用天气 API 工具获取天气数据
    const weatherData = await callToolHandler(
      {
        params: {
          name: "weather_api",
          arguments: { city }
        }
      },
      "weather_report_fetch"
    );

    // 调用文本格式化工具生成报告
    const report = await callToolHandler(
      {
        params: {
          name: "text_formatter",
          arguments: {
            template: "Weather report for {city}: {conditions}, {temperature}°C",
            data: {
              city,
              conditions: weatherData.content[0].text.conditions,
              temperature: weatherData.content[0].text.temperature
            }
          }
        }
      },
      "weather_report_format"
    );

    return report;
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to generate weather report: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

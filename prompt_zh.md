# 工具箱使用指南

## 如何添加新工具

以下是添加新工具的详细步骤和注意事项：

1. **创建工具文件：** 在 `src/tools/` 目录下创建一个新的 TypeScript 文件（例如：`my_tool.ts`）。

2. **定义参数列表（schema）：**
   * 在此文件中，导出一个 `schema` 对象来描述工具的参数。
   * `schema` 对象必须包含以下属性：`name`（工具名称）、`description`（工具描述）、`type`（必须为 `"object"`）、`properties`（参数定义）、`required`（必需参数列表）和 `outputSchema`（输出格式定义）。
   * `properties` 对象中的每个参数定义必须包含 `type`（参数类型，如 `"string"`、`"number"`、`"boolean"`）和 `description`（参数描述）属性。
   * 如果参数是枚举类型，可以使用 `enum` 属性指定枚举值。
   * `outputSchema` 用于定义工具的输出格式，包括 `content`（内容数组）和 `isError`（是否发生错误）属性。
   * **注意事项：**
     * `name` 必须唯一，不能与其他工具重复。
     * `description` 应清晰简洁，描述工具的功能。
     * `required` 数组应包含所有必需参数，以避免工具执行过程中出现错误。
     * `outputSchema` 应与 `default` 函数的返回值一致，以确保输出格式正确。

3. **实现工具逻辑（default 函数）：**
   * 同样在此文件中，导出一个 `default` 函数来实现工具的具体功能。
   * `default` 函数必须接收一个 `request` 参数，其中包含请求信息，如参数等。
   * `default` 函数必须返回一个 Promise，且 resolved 值应为一个包含 `content` 属性的对象。`content` 属性是一个数组，包含一个对象，该对象包含 `type`（内容类型，如 `"text"`）和 `text`（内容文本）属性。
   * **注意事项：**
     * `request.params.arguments` 对象包含客户端传递的参数。
     * 应对参数进行验证，确保参数的类型和值符合预期。
     * 如果工具执行过程中发生错误，Promise 应被拒绝，并返回一个包含 `isError: true` 的对象。
     * `content` 数组可以包含多个对象，以返回多个结果。
     * 工具可以通过 `callToolHandler` 函数调用其他工具：
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
     * **注意事项：**
       - 仅在需要形成工具调用链时主动使用 `callToolHandler`。
       - 常规工具执行日志由系统自动记录，无需手动添加。
       - 错误处理不需要，也不应该调用 `callToolHandler` 进行日志记录。
       - 第一个参数：包含工具名称和参数的请求对象。
       - 第二个参数：调用者的唯一标识符，用于日志追踪。
       - 被调用的工具将记录调用链信息：
         ```json
         {
           "caller": "caller_identifier",
           "tool": "target_tool_name",
           "tid": "关联的任务ID（可选）"
         }
         ```
       - 调用链标识符应遵循 `<父工具名称>_<唯一后缀>` 格式，例如：
         ```typescript
         // 计划任务调用示例
         `schedule_tool_${task.id}`
         ```
       - 多级调用将自动形成完整的调用链，可通过日志字段追踪完整的执行路径。

4. **tool动态加载：**
   * `tools` 目录中的文件会被动态加载。无需修改 `src/index.ts` 或 `src/handler/ToolHandler.ts`。

5. **编译文件：**
   * 添加或修改代码后，需要编译文件。可以使用 `npm run build` 命令编译文件。

6. **重启 MCP 服务器：**
   * 编译文件后，需要重启 MCP 服务器以使新工具生效。
   * 请手动重启 MCP 服务器。

7. **测试工具：**
   * 编译文件后，可以通过 MCP 客户端调用工具，测试其功能是否正常。
   * 可以使用 `listToolsHandler` 列出所有工具，确认新工具已成功加载。

## 日志规范

**日志文件路径：** `./log/ToolBox.log`

### 统一日志处理机制

系统通过 callToolHandler 实现集中日志记录：

1. **自动日志记录**
   - 所有工具调用通过 `callToolHandler` 自动记录日志，无需手动添加日志代码
   - 记录的信息包括：执行时间、参数、持续时间和状态（成功/错误）
   - 错误日志自动捕获错误消息和堆栈跟踪
2. **调用链跟踪**   
   - 调用者标识符遵循 `<parent_tool>_<unique_suffix>` 格式
   - 多级调用自动形成可追踪的执行路径

3. **标准化日志结构**
   | 字段   | 来源                  | 示例                        |
   |--------|-------------------------|------------------------------|
   | ts     | ISO 8601 时间戳        | "2025-03-15T02:29:40.123Z"   |
   | tool   | 请求工具名称           | "docker_tool"                |
   | caller | 调用链标识符           | "schedule_tool_123"          |
   | args   | 执行参数               | { "image": "nginx" }         |
   | stat   | success/error          | "success"                    |
   | cost   | 执行持续时间（毫秒）   | 158                          |
   | err    | 错误消息               | "Invalid image format"       |
   | trace  | 错误堆栈跟踪           | Error: Invalid image format... |

## 错误处理最佳实践

1. **使用 try-catch 包装关键代码**：
  ```typescript
   try {
     // 关键操作
   } catch (error) {
     // 处理错误
     throw new Error(`操作失败: ${error instanceof Error ? error.message : String(error)}`);
   }
  ```

**工具开发示例**：

```typescript
import { z } from 'zod';

// 定义参数模式
export const schema = {
  name: "hello_world",
  description: "一个简单的Hello World工具，返回问候消息",
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "要问候的名称"
    },
    language: {
      type: "string",
      enum: ["en", "zh", "fr"],
      description: "问候语言（en: 英语, zh: 中文, fr: 法语）"
    }
  },
  required: ["name"],
  outputSchema: {
    type: "object",
    properties: {
      content: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            text: { type: "string" }
          }
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
    if (!name || typeof name !== "string") {
      throw new Error("名称参数必须是非空字符串");
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
```

**工具调用链示例**：

```typescript
import { callToolHandler } from '../handler/ToolHandler.js';

export default async function(request: any) {
  try {
    const { city } = request.params.arguments;
    
    // 调用天气API工具获取天气数据
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

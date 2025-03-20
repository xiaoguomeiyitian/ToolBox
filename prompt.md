# Toolbox Usage Guide

## How to Add a New Tool

Here are the detailed steps and precautions for adding a new tool:

1.  **Create a Tool File:** Create a new TypeScript file (e.g., `my_tool.ts`) in the `src/tools/` directory.

2.  **Define the Parameter List (schema):**
    *   In this file, export a `schema` object to describe the tool's parameters.
    *   The `schema` object must contain the following properties: `name` (tool name), `description` (tool description), `type` (must be `"object"`), `properties` (parameter definitions), `required` (list of required parameters).
    *   Each parameter definition in the `properties` object must include the `type` (parameter type, such as `"string"`, `"number"`, `"boolean"`) and `description` (parameter description) properties.
    *   If the parameter is an enumeration type, you can use the `enum` property to specify the enumeration values.
    *   **Precautions:**
        *   `name` must be unique and cannot be duplicated with other tools.
        *   `description` should be clear and concise, describing the function of the tool.
        *   The `required` array should contain all required parameters to avoid errors during tool execution.

3.  **Implement Tool Logic (default Function):**
    *   Also in this file, export a `default` function to implement the specific function of the tool.
    *   The `default` function must receive a `request` parameter, which contains request information, such as parameters.
    *   The `default` function must return a Promise, and the resolved value should be an object containing the `content` property. The `content` property is an array containing an object, which contains the `type` (content type, such as `"text"`) and `text` (content text) properties. The `text` property should be a JSON string formatted with `JSON.stringify(results, null, 2)`.
    *   To avoid memory leaks during automatic tool reloading, it is recommended to add a destroy function.
    *   **Destroy Function:**
        *   In the tool file, export a `destroy` function to release memory, stop timers, disconnect, etc.
        *   The system automatically calls this function before the tool is reloaded.
    *   **Precautions:**
        *   The `request.params.arguments` object contains the parameters passed by the client.
        *   Parameters should be validated to ensure that the type and value of the parameters meet expectations.
        *   If an error occurs during tool execution, the Promise should be rejected and return an object containing `isError: true`.
        *   The `content` array can contain multiple objects to return multiple results.
        *   Tools can call other tools through the `callToolHandler` function:

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
        *   **Precautions:**
            *   Only use `callToolHandler` proactively when you need to form a tool call chain.
            *   Regular tool execution logs are automatically recorded by the system and do not need to be added manually.
            *   Error handling does not need to, and should not, call `callToolHandler` for logging.
            *   The first parameter: a request object containing the tool name and parameters.
            *   The second parameter: the unique identifier of the caller, used for log tracking.
            *   The called tool will record the call chain information:

                ```json
                {
                  "caller": "caller_identifier",
                  "tool": "target_tool_name",
                  "tid": "associated task ID (optional)"
                }
                ```
            *   The call chain identifier should follow the `<parent_tool>_<unique_suffix>` format, for example:

                ```typescript
                `schedule_tool_${task.id}`
                ```
            *   Multi-level calls will automatically form a complete call chain, and the complete execution path can be tracked through the log fields.

4.  **Tool Dynamic Loading:**
    *   Files in the `tools` directory are dynamically loaded. No need to modify `src/index.ts` or `src/handler/ToolHandler.ts`.

5. **Auto Build & Reload:**
    # Execute through MCP client
    call MCP Tool buildReload_tool
    This will automatically:
    - Compile source code
    - Reload all tools
    - Verify tool registry

6. **Testing Tools:**
    After adding new tool code, directly call the MCP server's `buildReload_tool` to compile and load the new tool. If the execution is successful, you can immediately call the newly added MCP server tool for testing, thus achieving automated development and testing. If a test problem occurs, fix the problem, recompile, call the MCP server's `buildReload_tool` to compile and load, and then test again.
    # Complete development cycle example:
    # 1. After creating a new tool
    call MCP Tool buildReload_tool
    # 2. Immediately test the new tool
    call MCP Tool your_new_tool --args '{"param1":"value1"}'
    # 3. Fix and reload based on test results

## Logging Specifications

**Log File Path:** `./log/ToolBox.log`

### Unified Log Processing Mechanism

The system implements centralized log recording through callToolHandler:

1.  **Automatic Log Recording**
    *   All tool calls are automatically logged through `callToolHandler` without manually adding log code.
    *   The recorded information includes: execution time, parameters, duration, and status (success/error).
    *   Error logs automatically capture error messages and stack traces.
2.  **Call Chain Tracking**
    *   Caller identifiers follow the `<parent_tool>_<unique_suffix>` format.
    *   Multi-level calls automatically form a traceable execution path.

3.  **Standardized Log Structure**

    | Field  | Source                   | Example                         |
    | ------ | ------------------------ | ------------------------------- |
    | ts     | ISO 8601 Timestamp       | "2025-03-15T02:29:40.123Z"    |
    | tool   | Request Tool Name        | "docker\_tool"                 |
    | caller | Call Chain Identifier    | "schedule\_tool\_123"           |
    | args   | Execution Parameters       | { "image": "nginx" }            |
    | stat   | success/error           | "success"                     |
    | cost   | Execution Duration (ms) | 158                           |
    | err    | Error Message            | "Invalid image format"        |
    | trace  | Error Stack Trace        | Error: Invalid image format... |

## Error Handling Best Practices

**Use try-catch to Wrap Key Code**:

    ```typescript
    try {
      // Key operations
    } catch (error) {
      // Handle errors
      throw new Error(`Operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    ```

**Tool Development Example**:

```typescript
// Define parameter schema
export const schema = {
  name: "hello_world",
  description: "A simple Hello World tool that returns a greeting message",
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "The name to greet"
    },
    language: {
      type: "string",
      enum: ["en", "zh", "fr"],
      description: "Greeting language (en: English, zh: Chinese, fr: French)"
    }
  },
  required: ["name"]
};

// Implement tool logic
export default async function(request: any) {
  try {
    const { name, language = "en" } = request.params.arguments;

    // Parameter validation
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("The name parameter must be a non-empty string");
    }

    // Generate greeting according to language
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

    // Return result
    return {
      content: [
        {
          type: "text",
          text: greeting
        }
      ]
    };
  } catch (error) {
    // Error handling
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

// Destroy function
export async function destroy() {
  // Release resources, stop timers, disconnect, etc.
  console.log("Destroy hello_world tool");
}
```

**Tool Call Chain Example**:

```typescript
import { callToolHandler } from '../handler/ToolHandler.js';

export default async function(request: any) {
  try {
    const { city } = request.params.arguments;

    // Call the weather API tool to get weather data
    const weatherData = await callToolHandler(
      {
        params: {
          name: "weather_api",
          arguments: { city }
        }
      },
      "weather_report_fetch"
    );

    // Call the text formatting tool to generate a report
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

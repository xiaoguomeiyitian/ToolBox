# How to Add a New Tool

Here are the detailed steps and precautions for adding a new tool:

1. **Create a Tool File:** Create a new TypeScript file (e.g., `my_tool.ts`) in the `src/tools/` directory.

2.  **Define the Parameter List (schema):**
    *   In this file, export a `schema` object to describe the tool's parameters.
    *   The `schema` object must include the following properties: `name` (tool name), `description` (tool description), `type` (must be `"object"`), `properties` (parameter definitions), `required` (list of required parameters), and `outputSchema` (output format definition).
    *   Each parameter definition in the `properties` object must include the `type` (parameter type, e.g., `"string"`, `"number"`, `"boolean"`) and `description` (parameter description) properties.
    *   If the parameter is an enumeration type, you can use the `enum` property to specify the enumeration values.
    *   `outputSchema` is used to define the output format of the tool, including the `content` (content array) and `isError` (whether an error occurred) properties.
    *   **Precautions:**
        *   `name` must be unique and cannot be repeated with other tools.
        *   `description` should be clear and concise, describing the function of the tool.
        *   The `required` array should include all required parameters to avoid errors during tool execution.
        *   `outputSchema` should be consistent with the return value of the `default` function to ensure the output format is correct.

3.  **Implement Tool Logic (default function):**
    *   Also in this file, export a `default` function to implement the specific function of the tool.
    *   The `default` function must receive a `request` parameter, which contains the request information, such as parameters.
    *   The `default` function must return a Promise, and the resolved value should be an object containing the `content` property. The `content` property is an array containing an object, which contains the `type` (content type, e.g., `"text"`) and `text` (content text) properties.
    *   **Precautions:**
        *   The `request.params.arguments` object contains the parameters passed by the client.
        *   The parameters should be validated to ensure that the type and value of the parameters meet expectations.
    *   If an error occurs during tool execution, the Promise should be rejected and an object containing `isError: true` should be returned.
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
        - Only use `callToolHandler` proactively when a tool call chain needs to be formed.
        - Regular tool execution logs are automatically recorded by the system; manual addition is not required.
        - Error handling does not require, and should not call `callToolHandler` for logging.
        - First parameter: Request object containing the tool name and parameters.
        - Second parameter: Unique identifier of the caller for log tracing.
        - The called tool will record the call chain information:
          ```json
          {
            "caller": "caller_identifier",
            "tool": "target_tool_name",
            "tid": "Associated task ID (optional)"
          }
          ```
        - The call chain identifier should follow the `<parent tool name>_<unique suffix>` format, for example:
          ```typescript
          // Scheduled task call example
          `schedule_tool_${task.id}`
          ```
        - Multi-level calls will automatically form a complete call chain, and the complete execution path can be traced through log fields.

4.  **Create Test File:**
    *   Create a new TypeScript file (e.g., `my_tool.test.ts`) in the `test/tools/` directory.

5. **Write Test Cases:**
   - Refer to the example: `test/tools/time_tool.test.ts`
   - Must include:
     - Parameter validation tests (verifying required parameter missing scenarios)
     - External dependency Mock (such as file system operations)
   - Execution method:
     - Full test: `npm run test`
     - Single test: `npm run test -- test/tools/TestFileName`

6.  **Run Test Cases:**
    *   Use the `npm run test` command to run all test cases, or use the `npm run test -- test/tools/TestFileName` command to run a single test case.

7.  **Verify Test Results:**
    *   Check the test results to ensure that all test cases pass. If tests fail, use this feedback to identify flaws in the tool implementation and iterate improvements.

8.  **Configure Dynamic Loading:**
    *   Files in the `tools` directory are dynamically loaded. Ensure your tool file follows this structure:
        ```typescript
        import { ToolSchema } from '@modelcontextprotocol/sdk';
        
        export const schema: ToolSchema = {
          name: 'your_tool_name',
          description: 'Tool functionality description',
          type: 'object',
          properties: {
            // Add parameter definitions
            param1: {
              type: 'string',
              description: 'Parameter description',
              enum: ['OPTION1', 'OPTION2'] // Example enum
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
    *   No need to modify `src/index.ts` or `src/handler/ToolHandler.ts`

9.  **Compile Files:**
    *   After adding or modifying the code, you need to compile the files. You can use the `npm run build` command to compile the files.

10. **Restart the MCP Server:**
    *   After compiling the files, you need to restart the MCP server for the new tool to take effect.
    *   Please manually restart the MCP server.

11. **Test the Tool:**
    *   After compiling the files, you can call the tool through the MCP client to test whether its function is normal.
    *   You can use `listToolsHandler` to list all tools and confirm that the new tool has been successfully loaded.

## Logging Specifications

**Log file path:** `./log/ToolBox.log`

### Unified Log Processing Mechanism

The system implements centralized logging through callToolHandler:

1. **Automatic Logging**
- All tool calls are automatically logged via `callToolHandler`, eliminating the need for manual logging code.
- Logged information includes: execution time, parameters, duration, and status (success/error).
- Error logs automatically capture error messages and stack traces.

2. **Standardized Log Structure**
| Field  | Source                  | Example                      |
|--------|-------------------------|------------------------------|
| ts     | ISO 8601 timestamp      | "2025-03-15T02:29:40.123Z"   |
| tool   | Request tool name       | "docker_tool"                |
| caller | Call chain identifier   | "schedule_tool_123"          |
| args   | Execution parameters     | { "image": "nginx" }         |
| stat   | success/error           | "success"                    |
| cost   | Execution duration (ms) | 158                          |
| err    | Error message           | "Invalid image format"       |
| trace  | Error stack trace        | Error: Invalid image format... |

3. **Call Chain Tracking**
- Caller identifiers follow `<parent_tool>_<unique_suffix>` format
- Multi-level calls automatically form traceable execution paths

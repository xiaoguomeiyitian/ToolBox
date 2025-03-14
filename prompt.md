# How to Add a New Tool

Here are the detailed steps and precautions for adding a new tool:

1.  **Create a Tool File:** Create a new TypeScript file (e.g., `my_tool.ts`) in the `src/tool/` directory.

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

4.  **Dynamic Loading:**
    *   Files in the `tool` directory are dynamically loaded, so after adding a new tool file, there is no need to modify the `src/index.ts` and `src/handler/ToolHandler.ts` files.

5.  **Compile Files:**
    *   After adding or modifying the code, you need to compile the files. You can use the `npm run build` command to compile the files.

6.  **Test the Tool:**
    *   After adding the tool, you can call the tool through the MCP client to test whether its function is normal.
    *   You can use `listToolsHandler` to list all tools and confirm that the new tool has been successfully loaded.

7.  **Restart the MCP Server:**
    *   After compiling the files, you need to restart the MCP server for the new tool to take effect.
    *   Please manually restart the MCP server.

## Logging Specifications

**Log file path:** `./log/ToolBox.log`

Key log entry fields description (original → optimized):
| Original Field | Optimized Field | Description                          |
|----------------|-----------------|--------------------------------------|
| timestamp      | ts              | Event timestamp (ISO 8601 format)    |
| params         | args            | Tool execution parameters            | 
| status         | stat            | Execution status (success/error)     |
| duration       | cost            | Operation duration in milliseconds   |
| error          | err             | Error message (if any)               |
| stack          | trace           | Error stack trace (if any)           |
| taskId         | tid             | Scheduled task unique identifier     |
| triggerTime    | trigTs          | Scheduled task trigger timestamp     |

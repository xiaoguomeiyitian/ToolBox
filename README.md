# ToolBox MCP Server

A versatile Model Context Protocol (MCP) server providing a collection of tools for various tasks.

This TypeScript-based server acts as a toolbox, offering functionalities ranging from note creation to data manipulation and system interaction. It showcases core MCP concepts by:

- Exposing tools that perform specific actions.
- Dynamically generating resources based on tool execution.
- Providing prompts for data summarization and other tasks.

[中文文档](README_ZH.md)

[Tools](TOOL.md)

## Features

### Tools

This server offers a diverse set of tools:

- `create_note`: Creates and stores simple text notes.
    - Input:
        - `title` (string): Note title
        - `content` (string): Note text content
- `compress_tool`: Compresses and extracts files in zip, tar, and tar.gz formats.
    - Input:
        - `action` (string): Action type: compress or extract
        - `sourcePath` (string): Absolute path to source file/directory
        - `destinationPath` (string): Absolute path to destination file/directory
        - `format` (string): Compression format: zip, tar, tar.gz
- `mongo_tool`: Executes queries against MongoDB databases.
    - Input:
        - `where` (string): Query condition in JSON string format. For example: {\"age\": {\"$gt\": 18}} to find users over 18 years old.
        - `dbName` (string): The name of the MongoDB database to query.
        - `collectionName` (string): The name of the MongoDB collection to query.
        - `queryType` (string, optional): The type of MongoDB query to execute.
        - `data` (string, optional): Data to be inserted in JSON string format. Required for insertOne and insertMany operations.
        - `updateOperators` (string, optional): Update operators in JSON string format. Required for updateOne and updateMany operations.
- `redis_tool`: Interacts with Redis data stores.
    - Input:
        - `command` (string): The Redis command to execute.
        - `args` (string, optional): Parameters of the Redis command in JSON string format.
- `schedule_tool`: Schedules tasks and reminders.
    - Input:
        - `action` (string): Action type
        - `time` (string): Time format: weekly@EEE@HH:mm, monthly@DD@HH:mm, now+Nm (N minutes later), now+Ns (N seconds later), once@YYYY-MM-DD HH:mm, once@HH:mm
        - `message` (string): Reminder message content
        - `id` (string, optional): Task ID (required for cancellation)
        - `tool_name` (string, optional): Name of the tool to execute
        - `tool_args` (object, optional): Tool parameters
- `sftp_tool`: Uploads and downloads files to/from SSH servers.
    - Input:
        - `serverName` (string): The name of the SSH server to connect to.
        - `action` (string): The action to perform: 'upload' or 'download'.
        - `localPath` (string): Local file path. Absolute path is required.
        - `remotePath` (string): Remote file path.
- `ssh_tool`: Executes commands on SSH servers.
    - Input:
        - `serverName` (string): The name of the SSH server to connect to.
        - `command` (string): The command to execute on the SSH server.
- `time_tool`: Retrieves the current time.
    - Input:
        - None

### Resources

Resources are generated dynamically as a result of tool execution. For example, the `create_note` tool creates a note resource that can be accessed via its URI.

### Prompts

- `summarize_notes`: Generates summaries of the notes created using the `create_note` tool.

## Adding a New Tool

To extend this MCP server with your own tools:

1.  Create a new TypeScript file within the `src/tool/` directory.
2.  Implement your tool, ensuring it exports both:
    - A `schema` object defining the tool's name, description, input parameters, and their types.
    - A `default` asynchronous function that executes the tool's logic based on the provided input.

```typescript
/** Parameters list of time_tool */
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
        console.error(`Error getting time: ${error}`);
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

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## Installation

To integrate with the Claude Desktop application, add the following server configuration to:

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
    "REDIS_URI": "",
    "SSH_server1_URI": ""
  },
  "disabled": false,
  "autoApprove": []
}
```

## Debugging

Debugging MCP servers can be challenging due to their stdio communication. Here are a few approaches:

1.  **Node.js Inspector:** Launch the server with the `--inspect=9229` flag:

```bash
node --inspect=9229 build/index.js
```

Then, connect to the server using Chrome DevTools by navigating to `chrome://inspect`.

2.  **MCP Inspector:** Utilize the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), a dedicated debugging tool accessible via the `inspector` npm script:

**VSCode Debugging**

To debug with VSCode, create a `.vscode/launch.json` file with the following configuration:

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

Then, launch the server with the `--inspect=9229` flag and attach the VSCode debugger.

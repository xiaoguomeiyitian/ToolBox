## Tools Specification

### compress_tool
**Description**: Compress and extract files using zip/tar/tar.gz formats  

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|-----------|------|----------|-------------|-------------|
| action | string | Yes | Operation type | ["compress", "extract"] |
| sourcePath | string | Yes | Absolute source path | - |
| destinationPath | string | Yes | Absolute target path | - | 
| format | string | Yes | Archive format | ["zip", "tar", "tar.gz"] |

**Output Schema**:
```typescript
{
  content: Array<{ type: "text", text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{
  "action": "compress",
  "sourcePath": "/path/to/files",
  "destinationPath": "/path/to/archive.zip",
  "format": "zip"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### create_note
**Description**: Create and store text notes  

**Input Schema**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Note title |
| content | string | Yes | Note content |

**Output Schema**:
```typescript
{
  content: [{
    type: "text",
    text: "Note created: {note_id}"
  }];
}
```

**Example Request**:
```json
{
  "title": "Meeting Notes",
  "content": "Discuss project requirements"
}
```

**Error Cases**:
- Returns `isError: true` if storage fails

---

### mongo_tool
**Description**: Executes queries against MongoDB databases.

**Input Schema**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| where | string | Yes | Query condition in JSON string format.  For example: `{\\\"age\\\": {\\\"$gt\\\": 18}}` to find users over 18 years old. |
| dbName | string | Yes | The name of the MongoDB database to query. |
| collectionName | string | Yes | The name of the MongoDB collection to query. |
| queryType | string | No | The type of MongoDB query to execute. |
| data | string | No | Data to be inserted in JSON string format. Required for insertOne and insertMany operations. |
| updateOperators | string | No | Update operators in JSON string format. Required for updateOne and updateMany operations. |

**Output Schema**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{
  "where": "{\\"age\\": {\\"$gt\\": 18}}",
  "dbName": "users",
  "collectionName": "profiles"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### redis_tool
**Description**: Interacts with Redis data stores.

**Input Schema**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| command | string | Yes | The Redis command to execute. |
| args | string | No | Parameters of the Redis command in JSON string format. |

**Output Schema**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{
  "command": "GET",
  "args": "{\\"key\\": \\"mykey\\"}"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### schedule_tool
**Description**: Schedules tasks and reminders.

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| action | string | Yes | Action type | ["create", "cancel", "list", "cancel_all_once", "cancel_all_recurring"] |
| time | string | No | Time format: weekly@EEE@HH:mm, monthly@DD@HH:mm, now+Nm (N minutes later), now+Ns (N seconds later), once@YYYY-MM-DD HH:mm, once@HH:mm |  |
| delaySeconds | number | No | Delay execution by N seconds (e.g. 300 for 5 minutes) |  |
| interval | string | No | Recurring interval pattern (e.g. 'every@5m' for 5 minutes, 'every@30s' for 30 seconds) |  |
| toolName | string | No | Name of the tool to execute (e.g. 'time_tool') |  |
| toolArgs | object | No | Parameters for the target tool |  |
| id | string | No | Task ID (required for cancellation) |  |

**Output Schema**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{
  "action": "create",
  "time": "now+5m",
  "toolName": "time_tool",
  "toolArgs": {}
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### sftp_tool
**Description**: Uploads and downloads files to/from SSH servers.

**Input Schema**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| serverName | string | Yes | The name of the SSH server to connect to. |
| action | string | Yes | The action to perform: 'upload' or 'download'. |
| localPath | string | Yes | Local file path. Absolute path is required. |
| remotePath | string | Yes | Remote file path. |

**Output Schema**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{
  "serverName": "my_ssh_server",
  "action": "upload",
  "localPath": "/path/to/local/file",
  "remotePath": "/path/to/remote/file"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### ssh_tool
**Description**: Executes commands on SSH servers.

**Input Schema**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| serverName | string | Yes | The name of the SSH server to connect to. |
| command | string | Yes | The command to execute on the SSH server. |

**Output Schema**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{
  "serverName": "my_ssh_server",
  "command": "ls -l"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### time_tool
**Description**: Get current time

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| format | string | No | The format of the time to return | ["iso", "timestamp", "local", "custom"] |
| pattern | string | No | The custom format pattern to use when format is custom. Required when format is custom. |  |
| timezone | string | No | The timezone to use. Defaults to the system's timezone. Example: Asia/Shanghai |  |

**Output Schema**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{
  "format": "iso",
  "timezone": "Asia/Shanghai"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

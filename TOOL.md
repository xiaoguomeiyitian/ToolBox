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
**Description**: Comprehensive MongoDB operations tool supporting queries, aggregations, CRUD operations, and index management

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| where | string | No | Query condition in JSON string format. Example: {\"age\": {\"$gt\": 18}} to find users older than 18. |  |
| dbName | string | Yes | The name of the MongoDB database to query. |  |
| collectionName | string | No | The name of the MongoDB collection to query. |  |
| field | string | No | Field name for distinct operation. |  |
| queryType | string | No | The type of MongoDB query to execute. | ["find", "findOne", "aggregate", "count", "distinct", "insertOne", "updateOne", "deleteOne", "insertMany", "updateMany", "deleteMany", "bulkWrite", "estimatedDocumentCount", "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace"] |
| data | string | No | Data to be inserted/updated in JSON string format. Required for insert/update operations. |  |
| updateOperators | string | No | Update operators in JSON string format. Required for update operations. |  |
| options | string | No | Additional options in JSON string format (e.g., sort, limit, skip, projection). |  |
| operationType | string | No | Database operation type for index and collection management | ["createIndex", "createIndexes", "dropIndex", "dropIndexes", "listIndexes", "listCollections", "createCollection", "dropCollection", "renameCollection", "collStats", "dbStats"] |
| indexes | string | No | Index specification JSON for index operations |  |
| indexOptions | string | No | Index options in JSON string format (e.g., unique, sparse, expireAfterSeconds) |  |
| pipeline | string | No | Aggregation pipeline stages in JSON string format. Required for aggregate operations. |  |
| newName | string | No | New name for renameCollection operation |  |
| bulkOperations | string | No | Array of bulk write operations in JSON string format. Required for bulkWrite operation. |  |

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
  "dbName": "your_db",
  "collectionName": "your_collection",
  "queryType": "find",
  "where": "{\\"status\\": \\"active\\"}",
  "options": "{\\"limit\\": 10}"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### redis_tool
**Description**: Execute any Redis command, fully supporting all Redis operations, including strings, hashes, lists, sets, sorted sets, streams, etc.

**Input Schema**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| command | string | Yes | The Redis command to execute (e.g., 'GET', 'SET', 'HGETALL', 'LPUSH', 'ZADD', etc.). |
| args | string | No | The arguments for the Redis command, provided in JSON string format. For example, for SET: '[\"key\", \"value\"]', for HSET: '[\"hash\", \"field\", \"value\"]'. |

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
    "command": "SET",
    "args": "[\"mykey\", \"myvalue\"]"
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

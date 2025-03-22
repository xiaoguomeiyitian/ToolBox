## Tools Specification

### buildReload_tool
**Description**: Execute 'npm run build' and reload all tools

**Input Schema**:
```typescript
{
  name: "buildReload_tool",
  description: "Execute 'npm run build' and reload all tools",
  type: "object",
  properties: {},
  required: [],
  outputSchema: {
    type: "object",
    properties: {
      content: {
        type: "array",
        items: {
          type: { type: "string" },
          text: { type: "string" }
        }
      },
      isError: { type: "boolean" }
    }
  }
}
```

**Output Schema**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**Example Request**:
```json
{}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### workflow_tool
**Description**: Cross-tool workflow orchestration engine, supports serial/parallel execution of multiple tools and manages transactions

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| version | string | No | Workflow definition format version (example: '1.0.1') | |
| steps | array | Yes | List of workflow steps (see example below) | |
| tool | string | No | Tool name (example: 'sftp_tool') | |
| args | object | No | Tool parameters (example: {action:'upload', localPath:'/tmp'}) | |
| retry | number | No | Number of retries (example: 3 means retry up to 3 times) | |
| timeout | number | No | Timeout (example: 5000 means 5 seconds timeout) | |
| parallel | boolean | No | Parallel execution (example: true means execute in parallel with subsequent steps) | |
| compensation | object | No | Compensation configuration example: {tool:'sftp_tool', args:{action:'delete'}} | |
| outputFile | string | No | Path to the output file (optional, supports absolute or relative paths, defaults to the log directory) | |

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
  "steps": [
    {
      "tool": "time_tool",
      "args": {}
    }
  ],
  "outputFile": "workflow_report.json"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### log_tool
**Description**: Query logs with filtering and pagination

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| pageSize | number | Yes | Number of logs per page (1-100) |  |
| page | number | Yes | Page number (>= 1) |  |
| toolName | string | No | Regular expression to match tool name |  |
| status | string | No | Status of the log (success or error) | ["success", "error"] |
| minDuration | number | No | Minimum duration in milliseconds |  |
| maxDuration | number | No | Maximum duration in milliseconds |  |
| startTime | string | No | Start time in ISO8601 format |  |
| endTime | string | No | End time in ISO8601 format |  |

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
  "pageSize": 10,
  "page": 1,
  "toolName": "time_tool"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### compress_tool
**Description**: Compress and extract files using zip/tar/tar.gz formats  

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| action | string | Yes | Operation type | ["compress", "extract"] |
| sourcePath | string | Yes | Absolute source path |  |
| destinationPath | string | Yes | Absolute target path |  |
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
**Description**: Create a new note

**Input Schema**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| title | string | Yes | Title of the note |
| content | string | Yes | Text content of the note |

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
  "title": "Meeting Notes",
  "content": "Discuss project requirements"
}
```

**Error Handling**:
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
| operationType | string | No | Database operation type for index and collection management | ["createIndex", "createIndexes", "dropIndex", "dropIndexes", "listIndexes", "listCollections", "colls", "createCollection", "dropCollection", "renameCollection", "collStats", "dbStats"] |
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
**Description**: Manage scheduled tasks with create/cancel/list operations

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| action | string | Yes | Action type (create/cancel/list tasks) | ["create", "cancel", "list", "cancel_all_once", "cancel_all_recurring"] |
| time | string | No | Absolute execution time in 'YYYY-MM-DD HH:mm:ss' format |  |
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
  "time": "2025-03-18 10:00:00",
  "toolName": "time_tool",
  "toolArgs": {}
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### sftp_tool
**Description**: Connect to SSH server and upload or download files

**Input Schema**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| serverName | string | Yes | The name of the SSH server to connect to. |
| action | string | Yes | The action to perform: 'upload' or 'download'. |
| localPath | string | Yes | The local file path. Absolute path is required. |
| remotePath | string | Yes | The remote file path. |

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
**Description**: Connect to SSH server and execute commands

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

---

### excel_tool
**Description**: A tool to read and write Excel and CSV files

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| action | string | Yes | Action to perform: read, write, or convert_json_to_xlsx | ["read", "write", "convert_json_to_xlsx"] |
| filePath | string | Yes | Absolute path to the file |  |
| format | string | Yes | File format | ["xlsx", "xls", "csv"] |
| data | array | No | Data to write to the file (required for write action) |  |
| options | object | No | Additional options |  |
| stream | boolean | No | Enable streaming for large files |  |
| chunkSize | number | No | Chunk size (rows) for streaming |  |

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
  "action": "read",
  "filePath": "/path/to/file.xlsx",
  "format": "xlsx"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### sqlite_tool
**Description**: A tool for performing SQLite database operations.

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| action | string | Yes | The type of operation to perform. | ["query", "transaction", "backup", "optimize", "index", "drop_index", "list_indexes", "table_info", "foreign_key_check", "integrity_check"] |
| dbName | string | Yes | The name of the database file (without the .db extension). |  |
| query | string | No | The SQL query to execute. |  |
| params | array | No | The parameters for the SQL query. |  |
| backupName | string | No | The name of the backup file (without the .db extension). |  |
| pagination | object | No | Pagination configuration for queries. |  |
| tableName | string | No | The name of the table to operate on. |  |
| indexName | string | No | The name of the index to operate on. |  |

**Output Schema**:
```typescript
{
  success: boolean;
  dataType: string;
  data: string;
}
```

**Example Request**:
```json
{
  "action": "query",
  "dbName": "test",
  "query": "SELECT * FROM users"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### calculator_tool
**Description**: A calculator_tool tool that supports various types of mathematical operations.

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| calculation_type | string | Yes | The type of mathematical calculation to perform. | ["evaluate_expression", "calculate_function", "calculate_statistics", "perform_geometry", "perform_financial_math", "perform_logic_operations", "perform_number_theory", "perform_combinatorics", "calculate_probability", "perform_set_theory", "perform_complex_number"] |
| expression | string | No | The mathematical expression to calculate (used when calculation_type is 'evaluate_expression'). |  |
| function_name | string | No | The name of the function to calculate (used when calculation_type is 'calculate_function'). |  |
| function_argument | number | No | The argument value for the function. |  |
| statistics_operation | string | No | The type of statistical calculation to perform (used when calculation_type is 'calculate_statistics'). | ["mean", "median", "mode", "standard_deviation", "variance", "correlation", "regression"] |
| data_points | array | No | The array of data points for statistical calculations. |  |
| data_set_x | array | No | The dataset X for bivariate statistics (only when needed). |  |
| data_set_y | array | No | The dataset Y for bivariate statistics (only when needed). |  |
| geometry_operation | string | No | The type of geometric calculation to perform (used when calculation_type is 'perform_geometry'). | ["area_circle", "area_rectangle", "volume_cube"] |
| radius | number | No | The radius of the circle. |  |
| length | number | No | The length. |  |
| width | number | No | The width. |  |
| height | number | No | The height. |  |
| side | number | No | The side length of the cube. |  |
| financial_math_operation | string | No | The type of financial math calculation to perform (used when calculation_type is 'perform_financial_math'). | ["simple_interest", "compound_interest", "present_value", "future_value"] |
| principal | number | No | The principal amount. |  |
| rate | number | No | The interest rate (percentage). |  |
| time | number | No | The time (in years). |  |
| n_compounding_periods | integer | No | The number of compounding periods. |  |
| logic_operation | string | No | The type of logic operation to perform (used when calculation_type is 'perform_logic_operations'). | ["AND", "OR", "NOT", "XOR"] |
| operand_a | boolean | No | The first operand. |  |
| operand_b | boolean | No | The second operand. |  |
| number_theory_operation | string | No | The type of number theory operation to perform (used when calculation_type is 'perform_number_theory'). | ["gcd", "lcm", "prime_factorization", "is_prime", "modular_exponentiation"] |
| number_a | integer | No | The first number for number theory operations. |  |
| number_b | integer | No | The second number for number theory operations (if needed). |  |
| number_theory_modulus | integer | No | The modulus for modular exponentiation. |  |
| combinatorics_operation | string | No | The type of combinatorics operation to perform (used when calculation_type is 'perform_combinatorics'). | ["permutation", "combination", "factorial", "binomial_coefficient"] |
| n_value | integer | No | The n value for combinatorics operations. |  |
| r_value | integer | No | The r value for combinatorics operations (if needed). |  |
| probability_operation | string | No | The type of probability calculation to perform (used when calculation_type is 'calculate_probability'). | ["probability_event", "conditional_probability", "bayes_theorem"] |
| probability_a | number | No | The probability of event A (between 0 and 1). |  |
| probability_b | number | No | The probability of event B (between 0 and 1). |  |
| probability_a_given_b | number | No | The conditional probability of A given B (between 0 and 1). |  |
| probability_b_given_a | number | No | The conditional probability of B given A (between 0 and 1). |  |
| set_theory_operation | string | No | The type of set theory operation to perform (used when calculation_type is 'perform_set_theory'). | ["union", "intersection", "difference", "symmetric_difference", "is_subset"] |
| set_a | array | No | The first set for set theory operations. |  |
| set_b | array | No | The second set for set theory operations. |  |
| complex_number_operation | string | No | The type of complex number operation to perform (used when calculation_type is 'perform_complex_number'). | ["add", "subtract", "multiply", "divide", "modulus", "argument", "conjugate"] |
| complex_a_real | number | No | The real part of the first complex number. |  |
| complex_a_imaginary | number | No | The imaginary part of the first complex number. |  |
| complex_b_real | number | No | The real part of the second complex number (if needed). |  |
| complex_b_imaginary | number | No | The imaginary part of the second complex number (if needed). |  |
| precision_level | number | No | Calculation precision level (32, 64, 128) | [32, 64, 128] |

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
  "calculation_type": "evaluate_expression",
  "expression": "2 + 2"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### cli_tool
**Description**: A cross-platform CLI executor with compiled artifacts directly in build/ directory.
Directory structure:
- Source code: src/
- Compiled output: build/ (flat structure)
- Logs: build/log/cli_tool.log

Execution context:
• All paths are resolved relative to build/ directory
• Logs always write to build/log/ subdirectory
Example valid paths:
- cwd: "" → build/
- cwd: "config" → build/config/

To avoid directory errors, ensure that relative paths are resolved from the `build/` directory.

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| command | string | No | Single-line command content |  |
| commands | array | No | Multi-line command sequence (mutually exclusive with 'command') |  |
| mode | string | No | Execution mode: sync - synchronous blocking, async - asynchronous non-blocking | ["sync", "async"] |
| timeout | number | No | Command timeout in seconds |  |
| cwd | string | No | Working directory resolution rules:• Absolute path: /absolute/path/here• Relative path: build/ + relativePath• Empty string: Uses build/ as root⚠️ Important: Does NOT reference src/ directoryExample:- Command ran in build/ directory- "cwd": "config" → resolves to build/config/ |  |
| platform | string | No | Force execution context:• "win32": Uses Windows path semantics• "linux": Uses POSIX path semantics• "auto": Matches build directory's OS type | ["auto", "win32", "linux", "darwin"] |
| safe_mode | boolean | No | Enable dangerous command filtering |  |

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
  "command": "ls -l",
  "mode": "sync",
  "cwd": ""
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### fileSystem_tool
**Description**: A cross-platform file system management tool that allows you to perform various operations on files and directories, such as reading, writing, copying, moving, deleting, listing, and managing permissions. For example, you can use it to read the content of a file, create a new directory, or change the permissions of a file.

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| operation | string | Yes | The type of file system operation to perform. | `["read", "write", "copy", "move", "delete", "list", "listDetails", "chmod", "chown", "getSize"]` |
| sourcePath | string | Yes | The absolute path to the source file or directory. For example, `"/home/coder/ToolBox/test/file.txt"` to specify a file in the test directory. |  |
| targetPath | string | No | The absolute path to the target file or directory. Required for `copy` and `move` operations. For example, `"/home/coder/ToolBox/test/new_file.txt"` to specify a new location for a copied or moved file. |  |
| recursive | boolean | No | Whether to perform the operation recursively on directories. If set to `true`, the operation will be applied to all subdirectories and files within the source directory. | `true`, `false` |
| overwrite | boolean | No | Whether to overwrite existing files during `copy` or `move` operations. If set to `true`, existing files will be overwritten. If set to `false`, the operation will fail if the target file already exists. | `true`, `false` |
| showHidden | boolean | No | Whether to include hidden files and directories in `list` and `listDetails` operations. If set to `true`, hidden files and directories (those starting with a `.`) will be included in the results. | `true`, `false` |
| fileMode | string | No | The file mode (permissions) to set for `chmod` operation, in octal format (e.g., 755). This parameter is only used for the `chmod` operation and specifies the permissions to be set on the file or directory. |  |
| uid | number | No | The user ID to set for `chown` operation. This parameter is only used for the `chown` operation and specifies the user ID to be set as the owner of the file or directory. |  |
| gid | number | No | The group ID to set for `chown` operation. This parameter is only used for the `chown` operation and specifies the group ID to be set as the group owner of the file or directory. |  |
| platformOverride | string | No | Override the platform to simulate different OS behavior. This is useful for testing cross-platform compatibility. If set to `'auto'`, the tool will use the current operating system. | `["auto", "linux", "win32", "darwin"]` |

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
  "operation": "list",
  "sourcePath": "/home/coder/ToolBox/test"
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

### image_tool
**Description**: Compresses images, supporting single files and batch processing of directories.

**Input Schema**:
| Parameter | Type | Required | Description | Enum Values |
|---|---|---|---|---|
| sourcePath | string | Yes | Absolute path to the source file or directory |  |
| outputPath | string | No | Absolute path to the output directory (defaults to source directory) |  |
| quality | number | No | Compression quality (1-100, defaults to 75) |  |
| resize | object | No | Resize options |  |
| format | string | No | Output format | jpeg, png, webp, avif, tiff, gif |
| mode | string | No | Execution mode (sync or async) | sync, async |
| recursive | boolean | No | Process subdirectories recursively |  |
| backupDir | string | No | Absolute path to the backup directory (if not specified, no backup) |  |

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
  "sourcePath": "/path/to/image.png",
  "quality": 60
}
```

**Error Handling**:
- Returns `isError: true` with error message in `content.text`

---

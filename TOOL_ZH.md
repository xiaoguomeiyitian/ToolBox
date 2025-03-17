## 工具规范

### compress_tool
**描述**: 使用 zip/tar/tar.gz 格式进行文件压缩和解压  

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|-----------|------|----------|-------------|-------------|
| action | string | 是 | 操作类型 | ["compress", "extract"] |
| sourcePath | string | 是 | 源文件绝对路径 | - |
| destinationPath | string | 是 | 目标路径绝对地址 | - | 
| format | string | 是 | 压缩格式 | ["zip", "tar", "tar.gz"] |

**输出规范**:
```typescript
{
  content: Array<{ type: "text", text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "action": "compress",
  "sourcePath": "/path/to/files",
  "destinationPath": "/path/to/archive.zip",
  "format": "zip"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段包含错误信息

---

### fileSystem_tool
**描述**: 跨平台文件系统管理工具

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| operation | string | 是 | 操作类型 | ["read", "write", "copy", "move", "delete", "list", "listDetails", "chmod", "chown", "getSize"] |
| sourcePath | string | 是 | 源文件/目录路径 | |
| targetPath | string | 否 | 目标路径（仅copy/move需要） | |
| recursive | boolean | 否 | 是否递归操作目录 | |
| overwrite | boolean | 否 | 是否覆盖已有文件 | |
| showHidden | boolean | 否 | 是否显示隐藏文件 | |
| fileMode | string | 否 | 八进制权限码（如 755） | |
| uid | number | 否 | 用户ID | |
| gid | number | 否 | 组ID | |
| platformOverride | string | 否 | 平台覆盖 | ["auto", "linux", "win32", "darwin"] |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "operation": "list",
  "sourcePath": "/home/coder/ToolBox/test"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### create_note
**描述**: 创建并存储文本笔记  

**输入规范**:
| 参数 | 类型 | 必填 | 描述 |
|-----------|------|----------|-------------|
| title | string | 是 | 笔记标题 |
| content | string | 是 | 笔记内容 |

**输出规范**:
```typescript
{
  content: [{
    type: "text",
    text: "笔记已创建: {note_id}"
  }];
}
```

**请求示例**:
```json
{
  "title": "会议记录",
  "content": "讨论项目需求"
}
```

**错误情况**:
- 存储失败时返回 `isError: true`

---

### mongo_tool
**描述**: 综合 MongoDB 操作工具，支持查询、聚合、CRUD 操作和索引管理

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| where | string | 否 | JSON 字符串格式的查询条件。 例如: {\"age\": {\"$gt\": 18}} 查找 18 岁以上的用户。 |  |
| dbName | string | 是 | 要查询的 MongoDB 数据库的名称。 |  |
| collectionName | string | 否 | 要查询的 MongoDB 集合的名称。 |  |
| field | string | 否 | distinct 操作的字段名称。 |  |
| queryType | string | 否 | 要执行的 MongoDB 查询的类型。 | ["find", "findOne", "aggregate", "count", "distinct", "insertOne", "updateOne", "deleteOne", "insertMany", "updateMany", "deleteMany", "bulkWrite", "estimatedDocumentCount", "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace"] |
| data | string | 否 | 要插入/更新的 JSON 字符串格式的数据。insert/update 操作需要。 |  |
| updateOperators | string | 否 | JSON 字符串格式的更新运算符。update 操作需要。 |  |
| options | string | 否 | JSON 字符串格式的附加选项 (例如，sort、limit、skip、projection)。 |  |
| operationType | string | 否 | 索引和集合管理的数据库操作类型 | ["createIndex", "createIndexes", "dropIndex", "dropIndexes", "listIndexes", "listCollections", "createCollection", "dropCollection", "renameCollection", "collStats", "dbStats"] |
| indexes | string | 否 | 索引操作的索引规范 JSON |  |
| indexOptions | string | 否 | JSON 字符串格式的索引选项 (例如，unique、sparse、expireAfterSeconds) |  |
| pipeline | string | 否 | JSON 字符串格式的聚合管道阶段。aggregate 操作需要。 |  |
| newName | string | 否 | renameCollection 操作的新名称 |  |
| bulkOperations | string | 否 | JSON 字符串格式的批量写入操作数组。bulkWrite 操作需要。 |  |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "dbName": "your_db",
  "collectionName": "your_collection",
  "queryType": "find",
  "where": "{\\"status\\": \\"active\\"}",
  "options": "{\\"limit\\": 10}"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### sqlite_tool
**描述**: SQLite数据库操作工具

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| action | string | 是 | 操作类型 | ["query", "transaction", "backup", "optimize", "index", "drop_index", "list_indexes", "table_info", "foreign_key_check", "integrity_check"] |
| dbName | string | 是 | 数据库名称 | |
| query | string | 否 | 待执行的SQL语句 | |
| params | array | 否 | 查询参数 | |
| backupName | string | 否 | 备份名称 | |
| pagination | object | 否 | 分页配置 | |
| tableName | string | 否 | 需要操作的表名称 | |
| indexName | string | 否 | 需要操作的索引名称 | |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "action": "query",
  "dbName": "test",
  "query": "SELECT * FROM users"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### workflow_tool
**描述**: 跨工具工作流编排引擎，支持串行/并行执行多个工具并管理事务

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| version | string | 否 | 工作流定义格式版本（示例：'1.0.1'） | |
| steps | array | 是 | 工作流步骤列表（示例见下方） | |
| tool | string | 否 | 工具名称（示例：'sftp_tool'） | |
| args | object | 否 | 工具参数（示例：{action:'upload', localPath:'/tmp'}) | |
| retry | number | 否 | 重试次数（示例：3 表示最多重试3次） | |
| timeout | string | 否 | 超时时间（示例：5000 表示5秒超时） | |
| parallel | boolean | 否 | 并行执行（示例：true 表示与后续步骤并行） | |
| compensation | object | 否 | 补偿配置示例：{tool:'sftp_tool', args:{action:'delete'}} | |
| outputFile | string | 否 | 结果输出文件路径（可选，支持绝对路径或相对路径，默认生成在日志目录） | |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
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

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### redis_tool
**描述**: 执行任何 Redis 命令，完全支持所有 Redis 操作，包括字符串、哈希、列表、集合、排序集合、流等。

**输入规范**:
| 参数 | 类型 | 必填 | 描述 |
|---|---|---|---|
| command | string | 是 | 要执行的 Redis 命令 (例如, 'GET', 'SET', 'HGETALL', 'LPUSH', 'ZADD' 等)。 |
| args | string | 否 | Redis 命令的参数，以 JSON 字符串格式提供。 例如，对于 SET: '[\"key\", \"value\"]'，对于 HSET: '[\"hash\", \"field\", \"value\"]'。 |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
    "command": "SET",
    "args": "[\"mykey\", \"myvalue\"]"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### schedule_tool
**描述**: 安排任务和提醒。

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| action | string | 是 | 操作类型 | ["create", "cancel", "list", "cancel_all_once", "cancel_all_recurring"] |
| time | string | 否 | 时间格式: weekly@EEE@HH:mm, monthly@DD@HH:mm, now+Nm (N 分钟后), now+Ns (N 秒后), once@YYYY-MM-DD HH:mm |  |
| delaySeconds | number | 否 | 延迟执行的秒数 (例如 300 表示 5 分钟) |  |
| interval | string | 否 | 循环间隔模式 (例如 'every@5m' 表示 5 分钟, 'every@30s' 表示 30 秒) |  |
| toolName | string | 否 | 要执行的工具的名称 (例如 'time_tool') |  |
| toolArgs | object | 否 | 目标工具的参数 |  |
| id | string | 否 | 任务 ID (取消时需要) |  |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "action": "create",
  "time": "now+5m",
  "toolName": "time_tool",
  "toolArgs": {}
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### sftp_tool
**描述**: 上传和下载文件到/从 SSH 服务器。

**输入规范**:
| 参数 | 类型 | 必填 | 描述 |
|---|---|---|---|
| serverName | string | 是 | 要连接的 SSH 服务器的名称。 |
| action | string | 是 | 要执行的操作: 'upload' 或 'download'。 |
| localPath | string | 是 | 本地文件路径。需要绝对路径。 |
| remotePath | string | 是 | 远程文件路径。 |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "serverName": "my_ssh_server",
  "action": "upload",
  "localPath": "/path/to/local/file",
  "remotePath": "/path/to/remote/file"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### ssh_tool
**描述**: 在 SSH 服务器上执行命令。

**输入规范**:
| 参数 | 类型 | 必填 | 描述 |
|---|---|---|---|
| serverName | string | 是 | 要连接的 SSH 服务器的名称。 |
| command | string | 是 | 要在 SSH 服务器上执行的命令。 |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "serverName": "my_ssh_server",
  "command": "ls -l"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### time_tool
**描述**: 获取当前时间

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| format | string | 否 | 要返回的时间格式 | ["iso", "timestamp", "local", "custom"] |
| pattern | string | 否 | 当 format 为 custom 时，要使用的自定义格式模式。当 format 为 custom 时，是必需的。 |  |
| timezone | string | 否 | 要使用的时区。默认为系统时区。示例: Asia/Shanghai |  |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "format": "iso",
  "timezone": "Asia/Shanghai"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### excel_tool
**描述**: 读写 Excel 和 CSV 文件的工具

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| action | string | 是 | 执行的动作：读或写 | ["read", "write"] |
| filePath | string | 是 | 文件的绝对路径 | |
| format | string | 是 | 文件格式 | ["xlsx", "xls", "csv"] |
| data | array | 否 | 要写入文件的数据（写操作时必填） | |
| options | object | 否 | 附加选项 | |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "action": "read",
  "filePath": "/path/to/file.xlsx",
  "format": "xlsx"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### calculator_tool
**描述**: 一个计算器工具，支持各种类型的数学运算。

**输入规范**:
| 参数 | 类型 | 必填 | 描述 | 可选值 |
|---|---|---|---|---|
| calculation_type | string | 是 | 要执行的数学计算的类型。 | ["evaluate_expression", "calculate_function", "calculate_statistics", "perform_geometry", "perform_financial_math", "perform_logic_operations", "perform_number_theory", "perform_combinatorics", "calculate_probability", "perform_set_theory", "perform_complex_number"] |
| expression | string | 否 | 要计算的数学表达式（当 calculation_type 为 'evaluate_expression' 时使用）。 | |
| function_name | string | 否 | 要计算的函数的名称（当 calculation_type 为 'calculate_function' 时使用）。 | |
| function_argument | number | 否 | 函数的参数值。 | |
| statistics_operation | string | 否 | 要执行的统计计算的类型（当 calculation_type 为 'calculate_statistics' 时使用）。 | ["mean", "median", "mode", "standard_deviation", "variance", "correlation", "regression"] |
| data_points | array | 否 | 统计计算的数据点数组。 | |
| data_set_x | array | 否 | 双变量统计的数据集 X（仅在需要时）。 | |
| data_set_y | array | 否 | 双变量统计的数据集 Y（仅在需要时）。 | |
| geometry_operation | string | 否 | 要执行的几何计算的类型（当 calculation_type 为 'perform_geometry' 时使用）。 | ["area_circle", "area_rectangle", "volume_cube"] |
| radius | number | 否 | 圆的半径。 | |
| length | number | 否 | 长度。 | |
| width | number | 否 | 宽度。 | |
| height | number | 否 | 高度。 | |
| side | number | 否 | 立方体的边长。 | |
| financial_math_operation | string | 否 | 要执行的金融数学计算的类型（当 calculation_type 为 'perform_financial_math' 时使用）。 | ["simple_interest", "compound_interest", "present_value", "future_value"] |
| principal | number | 否 | 本金。 | |
| rate | number | 否 | 利率（百分比）。 | |
| time | number | 否 | 时间（年）。 | |
| n_compounding_periods | integer | 否 | 复合周期数。 | |
| logic_operation | string | 否 | 要执行的逻辑运算的类型（当 calculation_type 为 'perform_logic_operations' 时使用）。 | ["AND", "OR", "NOT", "XOR"] |
| operand_a | boolean | 否 | 第一个操作数。 | |
| operand_b | boolean | 否 | 第二个操作数。 | |
| number_theory_operation | string | 否 | 要执行的数论运算的类型（当 calculation_type 为 'perform_number_theory' 时使用）。 | ["gcd", "lcm", "prime_factorization", "is_prime", "modular_exponentiation"] |
| number_a | integer | 否 | 数论运算的第一个数字。 | |
| number_b | integer | 否 | 数论运算的第二个数字（如果需要）。 | |
| number_theory_modulus | integer | 否 | 模幂运算的模数。 | |
| combinatorics_operation | string | 否 | 要执行的组合数学运算的类型（当 calculation_type 为 'perform_combinatorics' 时使用）。 | ["permutation", "combination", "factorial", "binomial_coefficient"] |
| n_value | integer | 否 | 组合数学运算的 n 值。 | |
| r_value | integer | 否 | 组合数学运算的 r 值（如果需要）。 | |
| probability_operation | string | 否 | 要执行的概率计算的类型（当 calculation_type 为 'calculate_probability' 时使用）。 | ["probability_event", "conditional_probability", "bayes_theorem"] |
| probability_a | number | 否 | 事件 A 的概率（介于 0 和 1 之间）。 | |
| probability_b | number | 否 | 事件 B 的概率（介于 0 和 1 之间）。 | |
| probability_a_given_b | number | 否 | A 给定 B 的条件概率（介于 0 和 1 之间）。 | |
| probability_b_given_a | number | 否 | B 给定 A 的条件概率（介于 0 和 1 之间）。 | |
| set_theory_operation | string | 否 | 要执行的集合论运算的类型（当 calculation_type 为 'perform_set_theory' 时使用）。 | ["union", "intersection", "difference", "symmetric_difference", "is_subset"] |
| set_a | array | 否 | 集合论运算的第一个集合。 | |
| set_b | array | 否 | 集合论运算的第二个集合。 | |
| complex_number_operation | string | 否 | 要执行的复数运算的类型（当 calculation_type 为 'perform_complex_number' 时使用）。 | ["add", "subtract", "multiply", "divide", "modulus", "argument", "conjugate"] |
| complex_a_real | number | 否 | 第一个复数的实部。 | |
| complex_a_imaginary | number | 否 | 第一个复数的虚部。 | |
| complex_b_real | number | 否 | 第二个复数的实部（如果需要）。 | |
| complex_b_imaginary | number | 否 | 第二个复数的虚部（如果需要）。 | |
| precision_level | number | 否 | 计算精度等级 (32, 64, 128) | [32, 64, 128] |

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**请求示例**:
```json
{
  "calculation_type": "evaluate_expression",
  "expression": "2 + 2"
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

### buildReload_tool
**描述**: 执行 'npm run build' 并重新加载所有工具

**输入规范**:
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

**输出规范**:
```typescript
{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
```

**错误处理**:
- 返回 `isError: true` 并在 `content.text` 字段中包含错误消息

---

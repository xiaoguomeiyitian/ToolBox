## 工具

- **compress_tool**
  - 压缩和提取 zip/tar/tar.gz 格式的文件
  - 输入:
    - `action` (string): 操作类型: 压缩或提取
    - `sourcePath` (string): 源文件/目录的绝对路径
    - `destinationPath` (string): 目标文件/目录的绝对路径
    - `format` (string): 压缩格式: zip, tar, tar.gz

- **create_note**
  - 创建一个新笔记
  - 输入:
    - `title` (string): 笔记标题
    - `content` (string): 笔记文本内容

- **mongo_tool**
  - 查询 MongoDB 数据
  - 输入:
    - `where` (string): JSON 字符串格式的查询条件。例如: {\"age\": {\"$gt\": 18}} 查找 18 岁以上的用户。
    - `dbName` (string): 要查询的 MongoDB 数据库的名称。
    - `collectionName` (string): 要查询的 MongoDB 集合的名称。
    - `queryType` (string, optional): 要执行的 MongoDB 查询的类型。
    - `data` (string, optional): 要插入的 JSON 字符串格式的数据。insertOne 和 insertMany 操作需要。
    - `updateOperators` (string, optional): JSON 字符串格式的更新运算符。updateOne 和 updateMany 操作需要。

- **redis_tool**
  - 操作 Redis 数据
  - 输入:
    - `command` (string): 要执行的 Redis 命令。
    - `args` (string, optional): JSON 字符串格式的 Redis 命令的参数。

- **schedule_tool**
  - 管理计划任务，支持创建/取消/列表
  - 输入:
    - `action` (string): 操作类型
    - `time` (string): 时间格式: weekly@EEE@HH:mm, monthly@DD@HH:mm, now+Nm (N 分钟后), now+Ns (N 秒后), once@YYYY-MM-DD HH:mm, once@HH:mm
    - `message` (string): 提醒消息内容
    - `id` (string, optional): 任务 ID (取消时需要)
    - `tool_name` (string, optional): 要执行的工具的名称
    - `tool_args` (object, optional): 工具参数

- **sftp_tool**
  - 连接到 SSH 服务器并上传或下载文件
  - 输入:
    - `serverName` (string): 要连接的 SSH 服务器的名称。
    - `action` (string): 要执行的操作: 'upload' 或 'download'。
    - `localPath` (string): 本地文件路径。需要绝对路径。
    - `remotePath` (string): 远程文件路径。

- **ssh_tool**
  - 连接到 SSH 服务器并执行命令
  - 输入:
    - `serverName` (string): 要连接的 SSH 服务器的名称。
    - `command` (string): 要在 SSH 服务器上执行的命令。

- **time_tool**
  - 获取当前时间
  - 输入:
    - 无

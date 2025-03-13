## Tools

- **compress_tool**
  - Compress and extract files using zip/tar/tar.gz formats
  - Inputs:
    - `action` (string): Action type: compress or extract
    - `sourcePath` (string): Absolute path to source file/directory
    - `destinationPath` (string): Absolute path to destination file/directory
    - `format` (string): Compression format: zip, tar, tar.gz

- **create_note**
  - Create a new note
  - Inputs:
    - `title` (string): Title of the note
    - `content` (string): Text content of the note

- **mongo_tool**
  - Query MongoDB data
  - Inputs:
    - `where` (string): Query condition in JSON string format. Example: {\"age\": {\"$gt\": 18}} to find users older than 18.
    - `dbName` (string): The name of the MongoDB database to query.
    - `collectionName` (string): The name of the MongoDB collection to query.
    - `queryType` (string, optional): The type of MongoDB query to execute.
    - `data` (string, optional): Data to be inserted in JSON string format. Required for insertOne and insertMany operations.
    - `updateOperators` (string, optional): Update operators in JSON string format. Required for updateOne and updateMany operations.

- **redis_tool**
  - Operate Redis data
  - Inputs:
    - `command` (string): The Redis command to execute.
    - `args` (string, optional): The arguments for the Redis command in JSON string format.

- **schedule_tool**
  - Manage scheduled tasks, supporting create/cancel/list
  - Inputs:
    - `action` (string): Action type
    - `time` (string): Time format: weekly@EEE@HH:mm, monthly@DD@HH:mm, now+Nm (N minutes later), now+Ns (N seconds later), once@YYYY-MM-DD HH:mm, once@HH:mm
    - `message` (string): Reminder message content
    - `id` (string, optional): Task ID (required for cancellation)
    - `tool_name` (string, optional): Name of the tool to execute
    - `tool_args` (object, optional): Tool parameters

- **sftp_tool**
  - Connect to SSH server and upload or download files
  - Inputs:
    - `serverName` (string): The name of the SSH server to connect to.
    - `action` (string): The action to perform: 'upload' or 'download'.
    - `localPath` (string): The local file path. Absolute path is required.
    - `remotePath` (string): The remote file path.

- **ssh_tool**
  - Connect to SSH server and execute commands
  - Inputs:
    - `serverName` (string): The name of the SSH server to connect to.
    - `command` (string): The command to execute on the SSH server.

- **time_tool**
  - Get current time
  - Inputs:
    - None

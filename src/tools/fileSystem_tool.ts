import fs from 'fs-extra';
import path from 'path';

// Define parameter schema
export const schema = {
  name: "fileSystem_tool",
  description: "Cross-platform file system management tool.",
  type: "object",
  properties: {
    operation: {
      type: "string",
      enum: ["read", "write", "copy", "move", "delete", "list", "listDetails", "chmod", "chown", "getSize"],
      description: "File system operation (read, write, copy, etc.)"
    },
    sourcePath: {
      type: "string",
      description: "Absolute path to source"
    },
    targetPath: {
      type: "string",
      description: "Absolute path to target (required for copy/move)"
    },
    recursive: {
      type: "boolean",
      default: false,
      description: "Recursively apply operation to directories"
    },
    overwrite: {
      type: "boolean",
      default: false,
      description: "Overwrite existing files during copy/move"
    },
    showHidden: {
      type: "boolean",
      default: false,
      description: "Include hidden files/directories in list/listDetails"
    },
    fileMode: {
      type: "string",
      pattern: "^[0-7]{3,4}$",
      description: "File mode (permissions) in octal format (e.g., 755)"
    },
    uid: {
      type: "number",
      description: "User ID for chown operation"
    },
    gid: {
      type: "number",
      description: "Group ID for chown operation"
    },
    platformOverride: {
      type: "string",
      enum: ["auto", "linux", "win32", "darwin"],
      default: "auto",
      description: "Override platform for OS behavior simulation"
    }
  },
  required: ["operation", "sourcePath"]
};

// Implement tool logic
export default async function(request: any) {
  try {
    const { operation, sourcePath, targetPath, recursive, overwrite, showHidden, fileMode, uid, gid, platformOverride } = request.params.arguments;

    // 1. 平台适配
    const platform = platformOverride === 'auto' ? process.platform : platformOverride;

    // 2. 路径标准化
    const normalizedSourcePath = sourcePath;
    const normalizedTargetPath = targetPath ? targetPath : null;

    // 3. 安全校验（示例）
    const basePath = '/home/coder/ToolBox'; // 示例安全路径
    if (!normalizedSourcePath.startsWith(basePath)) {
      throw new Error('Source path is outside the allowed base path.');
    }
    if (operation !== "write" && normalizedTargetPath && !normalizedTargetPath.startsWith(basePath)) {
      throw new Error('Target path is outside the allowed base path.');
    }

    switch (operation) {
      case "read":
        try {
          const data = await fs.readFile(normalizedSourcePath, 'utf-8');
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error reading file: ${err}` }], isError: true };
        }
      case "write":
        try {
          await fs.writeFile(normalizedSourcePath, targetPath, 'utf-8');
          return { content: [{ type: "text", text: `File written successfully to ${normalizedSourcePath}` }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error writing file: ${err}` }], isError: true };
        }
      case "copy":
        if (!normalizedTargetPath) {
          return { content: [{ type: "text", text: "Target path is required for copy operation" }], isError: true };
        }
        try {
          await fs.copy(normalizedSourcePath, normalizedTargetPath, { overwrite });
          return { content: [{ type: "text", text: `File copied successfully from ${normalizedSourcePath} to ${normalizedTargetPath}` }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error copying file: ${err}` }], isError: true };
        }
      case "move":
        if (!normalizedTargetPath) {
          return { content: [{ type: "text", text: "Target path is required for move operation" }], isError: true };
        }
        try {
          await fs.move(normalizedSourcePath, normalizedTargetPath, { overwrite });
          return { content: [{ type: "text", text: `File moved successfully from ${normalizedSourcePath} to ${normalizedTargetPath}` }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error moving file: ${err}` }], isError: true };
        }
     case "delete":
        try {
          await fs.remove(normalizedSourcePath);
          return { content: [{ type: "text", text: `File deleted successfully: ${normalizedSourcePath}` }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error deleting file: ${err}` }], isError: true };
        }
      case "list":
        try {
          const files = await fs.readdir(normalizedSourcePath);
          return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error listing files: ${err}` }], isError: true };
        }
      case "listDetails":
        try {
          const files = await fs.readdir(normalizedSourcePath);
          const fileDetails = await Promise.all(
            files.map(async (file) => {
              const filePath = path.join(normalizedSourcePath, file);
              const stat = await fs.stat(filePath);
              return {
                name: file,
                type: stat.isFile() ? "file" : stat.isDirectory() ? "directory" : "unknown",
                size: stat.size,
                modified: stat.mtime,
                permissions: stat.mode.toString(8),
              };
            })
          );
          return { content: [{ type: "text", text: JSON.stringify(fileDetails, null, 2) }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error listing file details: ${err}` }], isError: true };
        }
      case "chmod":
        try {
          if (!fileMode) {
            return { content: [{ type: "text", text: "File mode is required for chmod operation" }], isError: true };
          }
          await fs.chmod(normalizedSourcePath, fileMode);
          return { content: [{ type: "text", text: `File permissions changed successfully to ${fileMode}` }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error changing file permissions: ${err}` }], isError: true };
        }
      case "chown":
        try {
          if (uid === undefined && gid === undefined) {
            return { content: [{ type: "text", text: "UID or GID is required for chown operation" }], isError: true };
          }
          await fs.chown(normalizedSourcePath, uid, gid);
          return { content: [{ type: "text", text: `File owner changed successfully to UID: ${uid}, GID: ${gid}` }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error changing file owner: ${err}` }], isError: true };
        }
      case "getSize":
        try {
          let totalSize = 0;

          async function calculateSize(dirPath: string) {
            const files = await fs.readdir(dirPath);

            for (const file of files) {
              const filePath = path.join(dirPath, file);
              const stat = await fs.stat(filePath);

              if (stat.isFile()) {
                totalSize += stat.size;
              } else if (stat.isDirectory()) {
                await calculateSize(filePath);
              }
            }
          }

          await calculateSize(normalizedSourcePath);

          return { content: [{ type: "text", text: `Total size: ${totalSize} bytes` }] };
        } catch (err) {
          return { content: [{ type: "text", text: `Error getting size: ${err}` }], isError: true };
        }
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  } catch (error) {
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
  console.log("Destroy fileSystem_tool");
}

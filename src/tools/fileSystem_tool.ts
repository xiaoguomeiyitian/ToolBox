import fs from 'fs-extra';
import path from 'path';

// Define parameter schema
export const schema = {
  name: "fileSystem_tool",
  description: "一个强大的文件系统工具，用于执行读、写、复制、移动、删除、列表等操作。",
  type: "object",
  properties: {
    operation: {
      type: "string",
      enum: ["read", "write", "copy", "move", "delete", "list", "listDetails", "chmod", "chown", "getSize"],
      description: "要执行的文件系统操作 (例如: read, write, copy)"
    },
    sourcePath: {
      type: "string",
      description: "源文件的绝对路径"
    },
    targetPath: {
      type: "string",
      description: "目标文件的绝对路径 (用于 copy/move 操作)"
    },
    content: {
      type: "string",
      description: "要写入文件的内容 (用于 'write' 操作)"
    },
    recursive: {
      type: "boolean",
      default: false,
      description: "递归地对目录应用操作"
    },
    overwrite: {
      type: "boolean",
      default: false,
      description: "在 copy/move 操作中覆盖已存在的文件"
    },
    showHidden: {
      type: "boolean",
      default: false,
      description: "在 list/listDetails 中包含隐藏文件/目录"
    },
    fileMode: {
      type: "string",
      pattern: "^[0-7]{3,4}$",
      description: "文件模式（权限），使用八进制格式 (例如, 755)"
    },
    uid: {
      type: "number",
      description: "用于 chown 操作的用户 ID"
    },
    gid: {
      type: "number",
      description: "用于 chown 操作的组 ID"
    }
  },
  required: ["operation", "sourcePath"]
};

// Implement tool logic
export default async function(request: any) {
  try {
    const { 
      operation, 
      sourcePath, 
      targetPath, 
      content,
      recursive, 
      overwrite, 
      showHidden, 
      fileMode, 
      uid, 
      gid 
    } = request.params.arguments;

    const basePath = process.cwd();

    const isSafePath = (userPath: string | undefined) => {
      if (!userPath) return true; // Allow targetPath to be optional
      const resolvedPath = path.resolve(basePath, userPath);
      return resolvedPath.startsWith(basePath);
    };

    if (!isSafePath(sourcePath)) {
      throw new Error(`源路径 "${sourcePath}" 超出了允许的操作目录。`);
    }
    if (!isSafePath(targetPath)) {
      throw new Error(`目标路径 "${targetPath}" 超出了允许的操作目录。`);
    }

    switch (operation) {
      case "read": {
        const data = await fs.readFile(sourcePath, 'utf-8');
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "write": {
        if (content === undefined) {
          throw new Error('执行 "write" 操作必须提供 "content" 参数。');
        }
        await fs.writeFile(sourcePath, content, 'utf-8');
        return { content: [{ type: "text", text: `文件已成功写入到 ${sourcePath}` }] };
      }
      case "copy": {
        if (!targetPath) {
          throw new Error("执行 'copy' 操作必须提供 'targetPath' 参数。");
        }
        await fs.copy(sourcePath, targetPath, { overwrite });
        return { content: [{ type: "text", text: `文件已成功从 ${sourcePath} 复制到 ${targetPath}` }] };
      }
      case "move": {
        if (!targetPath) {
          throw new Error("执行 'move' 操作必须提供 'targetPath' 参数。");
        }
        await fs.move(sourcePath, targetPath, { overwrite });
        return { content: [{ type: "text", text: `文件已成功从 ${sourcePath} 移动到 ${targetPath}` }] };
      }
      case "delete": {
        await fs.remove(sourcePath);
        return { content: [{ type: "text", text: `文件 ${sourcePath} 已被成功删除。` }] };
      }
      case "list": {
        const files = await fs.readdir(sourcePath);
        // TODO: Implement showHidden filter
        return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
      }
      case "listDetails": {
        const files = await fs.readdir(sourcePath);
        const fileDetails = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(sourcePath, file);
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
        // TODO: Implement showHidden filter
        return { content: [{ type: "text", text: JSON.stringify(fileDetails, null, 2) }] };
      }
      case "chmod": {
        if (!fileMode) {
          throw new Error("执行 'chmod' 操作必须提供 'fileMode' 参数。");
        }
        await fs.chmod(sourcePath, fileMode);
        return { content: [{ type: "text", text: `文件权限已成功修改为 ${fileMode}` }] };
      }
      case "chown": {
        if (uid === undefined || gid === undefined) {
          throw new Error("执行 'chown' 操作必须同时提供 'uid' 和 'gid' 参数。");
        }
        await fs.chown(sourcePath, uid, gid);
        return { content: [{ type: "text", text: `文件所有者已成功变更为 UID: ${uid}, GID: ${gid}` }] };
      }
      case "getSize": {
        const stat = await fs.stat(sourcePath);
        let totalSize = stat.size;

        if (stat.isDirectory() && recursive) {
          // Note: This is a simplified size calculation for the top-level directory.
          const files = await fs.readdir(sourcePath);
          totalSize = (await Promise.all(files.map(async file => {
            const childPath = path.join(sourcePath, file);
            const childStat = await fs.stat(childPath);
            return childStat.size; // Simplified: doesn't recurse into subdirectories
          }))).reduce((a, b) => a + b, stat.size);
        }
        
        return { content: [{ type: "text", text: `路径 ${sourcePath} 的总大小为: ${totalSize} 字节` }] };
      }
      default:
        throw new Error(`不支持的操作: ${operation}`);
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
  console.log("Destroy fileSystem_tool");
}

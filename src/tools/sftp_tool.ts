import { Client } from 'ssh2';
import { promises as fs } from 'fs';
import path from 'path';

// 存储SSH连接的缓存
let sshConnections: { [key: string]: Client } = {};

// 定义 sftp_tool 工具的参数列表
export const schema = {
    name: "sftp_tool",
    description: "Connect to SSH server and upload/download files",
    type: "object",
    properties: {
        serverName: {
            type: "string",
            description: "SSH server name",
        },
        action: {
            type: "string",
            description: "Action: upload or download",
            enum: ["upload", "download"],
        },
        localPath: {
            type: "string",
            description: "Local file path (absolute)",
        },
        remotePath: {
            type: "string",
            description: "Remote file path",
        },
    },
    required: ["serverName", "action", "localPath", "remotePath"]
};

/**
 * 获取SSH连接
 * @param serverName 服务器名称
 * @returns SSH连接实例
 */
async function getSSHConnection(serverName: string): Promise<Client> {
    // 如果已有连接，直接返回
    if (sshConnections[serverName]) {
        return sshConnections[serverName];
    }

    // 从环境变量获取连接信息
    const sshUri = process.env[`SSH_${serverName}_URI`];
    if (!sshUri) {
        throw new Error(`SSH_${serverName}_URI environment variable must be set.`);
    }

    // 解析连接信息
    const [usernameAndpassword, HostAndport] = sshUri.split('@');
    const [username, password] = usernameAndpassword.split(':');
    const [host, port] = HostAndport.split(':');

    // 创建新连接
    return new Promise((resolve, reject) => {
        const conn = new Client();

        conn.on('ready', () => {
            sshConnections[serverName] = conn;
            resolve(conn);
        });

        conn.on('error', (err) => {
            delete sshConnections[serverName];
            reject(new Error(`SSH connection error: ${err.message}`));
        });

        conn.on('end', () => {
            delete sshConnections[serverName];
        });

        conn.connect({
            host: host,
            port: parseInt(port),
            username: username,
            password: password
        });
    });
}

/**
 * 获取SFTP会话
 * @param conn SSH连接
 * @returns SFTP会话
 */
function getSFTPSession(conn: Client): Promise<any> {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) {
                reject(new Error(`Failed to start SFTP session: ${err.message}`));
                return;
            }
            resolve(sftp);
        });
    });
}

/**
 * 确保远程目录存在
 * @param sftp SFTP会话
 * @param dirPath 目录路径
 */
async function ensureRemoteDir(sftp: any, dirPath: string): Promise<void> {
    try {
        await new Promise<void>((resolve, reject) => {
            sftp.stat(dirPath, (err: any) => {
                if (err) {
                    sftp.mkdir(dirPath, { recursive: true }, (mkdirErr: any) => {
                        if (mkdirErr) {
                            reject(new Error(`Failed to create remote directory: ${mkdirErr.message}`));
                        } else {
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            });
        });
    } catch (error) {
        throw new Error(`Failed to ensure remote directory exists: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * 确保本地目录存在
 * @param dirPath 目录路径
 */
async function ensureLocalDir(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        throw new Error(`Failed to create local directory: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * 上传文件
 * @param sftp SFTP会话
 * @param localPath 本地路径
 * @param remotePath 远程路径
 */
async function uploadFile(sftp: any, localPath: string, remotePath: string): Promise<string> {
    try {
        // 确保远程目录存在
        const remoteDir = path.dirname(remotePath);
        await ensureRemoteDir(sftp, remoteDir);

        // 上传文件
        return new Promise((resolve, reject) => {
            sftp.fastPut(localPath, remotePath, {}, (err: any) => {
                if (err) {
                    reject(new Error(`Upload failed: ${err.message}`));
                } else {
                    resolve(`File uploaded successfully to ${remotePath}`);
                }
            });
        });
    } catch (error) {
        throw new Error(`Upload operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * 下载文件
 * @param sftp SFTP会话
 * @param remotePath 远程路径
 * @param localPath 本地路径
 */
async function downloadFile(sftp: any, remotePath: string, localPath: string): Promise<string> {
    try {
        // 确保本地目录存在
        const localDir = path.dirname(localPath);
        await ensureLocalDir(localDir);

        // 下载文件
        return new Promise((resolve, reject) => {
            sftp.fastGet(remotePath, localPath, {}, (err: any) => {
                if (err) {
                    reject(new Error(`Download failed: ${err.message}`));
                } else {
                    resolve(`File downloaded successfully to ${localPath}`);
                }
            });
        });
    } catch (error) {
        throw new Error(`Download operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export default async (request: any) => {
    try {
        // 解析请求参数
        const { serverName, action, localPath, remotePath } = request.params.arguments;

        // 验证参数
        if (!serverName || !action || !localPath || !remotePath) {
            throw new Error("Missing required parameters: serverName, action, localPath, remotePath");
        }

        if (action !== 'upload' && action !== 'download') {
            throw new Error('Invalid action. Must be "upload" or "download".');
        }

        // 获取SSH连接
        const conn = await getSSHConnection(serverName);

        // 获取SFTP会话
        const sftp = await getSFTPSession(conn);

        let result;
        try {
            // 执行文件操作
            if (action === 'upload') {
                result = await uploadFile(sftp, localPath, remotePath);
            } else {
                result = await downloadFile(sftp, remotePath, localPath);
            }
        } finally {
            // 关闭SFTP会话
            sftp.end();
        }

        // 返回成功结果
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        message: result,
                        action: action,
                        localPath: localPath,
                        remotePath: remotePath
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        // 返回错误结果
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : String(error)
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
};

// Destroy function
export async function destroy() {
    console.log("Destroy sftp_tool");
    // 关闭所有SSH连接
    for (const serverName in sshConnections) {
        if (sshConnections[serverName]) {
            try {
                if (sshConnections[serverName].end) {
                    sshConnections[serverName].end();
                }
            } catch (error) {
                console.error(`Failed to close SSH connection for ${serverName}: ${error}`);
            } finally {
                delete sshConnections[serverName];
            }
        }
    }
    sshConnections = {};
}

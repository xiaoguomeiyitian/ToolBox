import { Client } from 'ssh2';

// 存储SSH连接的缓存
let sshConnections: { [key: string]: Client } = {};

// 定义 ssh_tool 工具的参数列表
export const schema = {
    name: "ssh_tool",
    description: "Connect to SSH server and execute commands",
    type: "object",
    properties: {
        serverName: {
            type: "string",
            description: "SSH server name",
        },
        command: {
            type: "string",
            description: "Command to execute",
        },
    },
    required: ["serverName", "command"]
};

// Destroy function
export async function destroy() {
    console.log("Destroy ssh_tool");
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
 * 在SSH服务器上执行命令
 * @param conn SSH连接
 * @param command 要执行的命令
 * @returns 命令执行结果
 */
async function executeCommand(conn: Client, command: string): Promise<{ stdout: string, stderr: string, code: number | null, signal: any }> {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) {
                reject(new Error(`Command execution failed: ${err.message}`));
                return;
            }
            
            let stdout = '';
            let stderr = '';
            
            stream.on('close', (code, signal) => {
                resolve({ stdout, stderr, code, signal });
            });
            
            stream.on('data', (data) => {
                stdout += data.toString();
            });
            
            stream.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            stream.on('error', (err) => {
                reject(new Error(`Stream error: ${err.message}`));
            });
        });
    });
}

export default async (request: any) => {
    try {
        // 解析请求参数
        const { serverName, command } = request.params.arguments;
        
        // 验证参数
        if (!serverName || !command) {
            throw new Error("Missing required parameters: serverName, command");
        }
        
        // 获取SSH连接
        const conn = await getSSHConnection(serverName);
        
        // 执行命令
        const result = await executeCommand(conn, command);
        
        // 返回成功结果
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        server: serverName,
                        command: command,
                        ...result
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

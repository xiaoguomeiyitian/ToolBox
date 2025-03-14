import { Client } from 'ssh2';
import { promises as fs } from 'fs';
import path from 'path';

let sshConnections: { [key: string]: any } = {};
// SSH_serverName_URI ：SSH 连接 URI，格式为 username:password@host:port
// 定义 sftp_tool 工具的参数列表
export const schema = {
    name: "sftp_tool",
    description: "Connect to SSH server and upload or download files",
    type: "object",
    properties: {
        serverName: {
            type: "string",
            description: "The name of the SSH server to connect to.",
        },
        action: {
            type: "string",
            description: "The action to perform: 'upload' or 'download'.",
            enum: ["upload", "download"],
        },
        localPath: {
            type: "string",
            description: "The local file path. Absolute path is required.",
        },
        remotePath: {
            type: "string",
            description: "The remote file path.",
        },
    },
    required: ["serverName", "action", "localPath", "remotePath"],
    outputSchema: {
        type: "object",
        properties: {
            content: {
                type: "array",
                items: {
                    type: {
                        type: "string",
                        description: "The content type (e.g., 'text')."
                    },
                    text: {
                        type: "string",
                        description: "The query result in JSON string format."
                    }
                },
                description: "An array containing the query result."
            },
            isError: {
                type: "boolean",
                description: "Indicates whether an error occurred during the query.",
                default: false
            }
        },
        required: ["content"]
    }
};

export default async (request: any) => {
    const serverName = request.params.arguments.serverName;
    const action = request.params.arguments.action;
    const localPath = request.params.arguments.localPath;
    const remotePath = request.params.arguments.remotePath;

    return new Promise(async (resolve, reject) => {
        if (!sshConnections[serverName]) {
            const sshUri = process.env[`SSH_${serverName}_URI`];

            if (!sshUri) {
                reject({
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(`SSH_${serverName}_URI environment variable must be set.`),
                        },
                    ],
                    isError: true,
                });
                return;
            }

            const [usernameAndpassword, HostAndport] = sshUri.split('@');
            const [username, password] = usernameAndpassword.split(':');
            const [host, port] = HostAndport.split(':');

            sshConnections[serverName] = new Client();
            sshConnections[serverName].on('ready', () => {
                performSftpAction(action, localPath, remotePath, resolve, reject, sshConnections[serverName]);
            }).on('error', (err: any) => {
                delete sshConnections[serverName];
                reject({
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(err.message),
                        },
                    ],
                    isError: true,
                });
            }).on('end', () => {
                delete sshConnections[serverName];
            }).connect({
                host: host,
                port: parseInt(port),
                username: username,
                password: password
            });
        } else {
            performSftpAction(action, localPath, remotePath, resolve, reject, sshConnections[serverName]);
        }
    }).catch((error: any) => {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(error.message),
                },
            ],
            isError: true,
        };
    });
};

async function performSftpAction(action: string, localPath: string, remotePath: string, resolve: any, reject: any, conn: any) {
    conn.sftp(async (err, sftp) => {
        if (err) {
            reject({
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(err.message),
                    },
                ],
                isError: true,
            });
            return;
        }

        try {
            if (action === 'upload') {
                // 检查远程目录是否存在，如果不存在则创建
                const remoteDir = path.dirname(remotePath);
                try {
                    await sftp.stat(remoteDir);
                } catch (err) {
                    await sftp.mkdir(remoteDir, { recursive: true });
                }

                sftp.fastPut(localPath, remotePath, {}, (err) => {
                    if (err) {
                        reject({
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(err.message),
                                },
                            ],
                            isError: true,
                        });
                        return;
                    }
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(`File uploaded successfully to ${remotePath}`),
                            },
                        ],
                    });
                    sftp.end();
                });
            } else if (action === 'download') {
                // 检查本地目录是否存在，如果不存在则创建
                const localDir = path.dirname(localPath);
                try {
                    await fs.stat(localDir);
                } catch (err) {
                    await fs.mkdir(localDir, { recursive: true });
                }

                sftp.fastGet(remotePath, localPath, {}, (err) => {
                    if (err) {
                        reject({
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(err.message),
                                },
                            ],
                            isError: true,
                        });
                        return;
                    }
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(`File downloaded successfully to ${localPath}`),
                            },
                        ],
                    });
                    sftp.end();
                });
            } else {
                reject({
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify('Invalid action. Must be "upload" or "download".'),
                        },
                    ],
                    isError: true,
                });
                sftp.end();
            }
        } catch (error: any) {
            reject({
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(error.message),
                    },
                ],
                isError: true,
            });
            sftp.end();
        }
    });
}

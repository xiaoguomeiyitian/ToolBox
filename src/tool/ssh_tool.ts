import { Client } from 'ssh2';

let sshConnections: { [key: string]: any } = {};
// SSH_serverName_URI ：SSH 连接 URI，格式为 username:password@host:port
// 定义 ssh_tool 工具的参数列表
export const schema = {
    name: "ssh_tool",
    description: "Connect to SSH server and execute commands",
    type: "object",
    properties: {
        serverName: {
            type: "string",
            description: "The name of the SSH server to connect to.",
        },
        command: {
            type: "string",
            description: "The command to execute on the SSH server.",
        },
    },
    required: ["serverName", "command"],
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

    return new Promise((resolve, reject) => {
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
                console.log(`SSH connection established to ${serverName}`);
                executeCommand(request.params.arguments.command, resolve, reject, sshConnections[serverName]);
            }).on('error', (err: any) => {
                console.error(`SSH connection error to ${serverName}:`, err);
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
                console.log(`SSH connection closed to ${serverName}`);
                delete sshConnections[serverName];
            }).connect({
                host: host,
                port: parseInt(port),
                username: username,
                password: password
            });
        } else {
            executeCommand(request.params.arguments.command, resolve, reject, sshConnections[serverName]);
        }
    }).catch((error) => {
        console.error("SSH Promise error:", error);
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

function executeCommand(command: string, resolve: any, reject: any, conn: any) {
    conn.exec(command, (err, stream) => {
        if (err) {
            console.error('SSH command execution error:', err);
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
        let output = '';
        stream.on('close', (code, signal) => {
            resolve({
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(output || ""),
                    },
                ],
            });
        }).on('data', (data: any) => {
            output += data;
        }).stderr.on('data', (data: any) => {
            output += 'ERROR: ' + data;
        }).on('error', (err: any) => {
            console.error('SSH command execution error:', err);
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
        });
    });
}

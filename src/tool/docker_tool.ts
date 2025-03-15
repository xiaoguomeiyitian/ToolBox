import path from 'path';
import os from 'os';
import Docker from 'dockerode';
import tar from 'tar-fs';

export const schema = {
    name: "docker_tool",
    description: "Docker container and image management tool",
    type: "object",
    properties: {
        action: {
            type: "string",
            description: "Operation type",
            enum: ["build", "run", "stop", "remove", "list", "prune", "tag"]
        },
        image: {
            type: "string",
            description: "Image name (required for build/run)"
        },
        dockerfile: {
            type: "string",
            description: "Absolute path to Dockerfile (required for build)"
        },
        containerId: {
            type: "string",
            description: "Container ID (required for stop/remove)"
        },
        portMapping: {
            type: "string",
            description: "Port mapping (format: hostPort:containerPort)"
        },
        buildArgs: {
            type: "object",
            description: "Build arguments"
        },
        filters: {
            type: "object",
            description: "Filters for listing containers",
            properties: {
                status: {
                    type: "string",
                    description: "Container status",
                    enum: ["running", "exited"]
                },
                label: {
                    type: "string",
                    description: "Label to filter by"
                }
            }
        },
        pruneType: {
            type: "string",
            description: "Type of prune",
            enum: ["image", "container", "all"]
        },
        confirm: {
            type: "boolean",
            description: "Confirmation flag for prune operation"
        },
        tag: {
            type: "object",
            description: "Tag operation parameters",
            properties: {
                sourceImage: { type: "string", description: "Source image name" },
                targetImage: { type: "string", description: "Target image name" },
                force: { type: "boolean", description: "Force overwrite existing tag" }
            }
        }
    },
    required: ["action"],
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
        },
        required: ["content"]
    }
};

async function createBuildContext(dockerfilePath: string) {
    const dir = path.dirname(dockerfilePath);
    return tar.pack(dir, {
        entries: [path.basename(dockerfilePath)],
        finalize: false,
        pack: {
            cwd: dir,
            strict: true
        }
    });
}

function normalizeDockerPath(input: string) {
    if (os.platform() === 'win32') {
        return input
            .replace(/^[A-Z]:/, '')
            .replace(/\\/g, '/')
            .replace(/^\//, '');
    }
    return input;
}

function sanitizeBuildArgs(buildArgs: Record<string, string>) {
    const envVars = { ...buildArgs };
    if (os.platform() === 'win32') {
        for (const key in envVars) {
            const winKey = key.toUpperCase().replace(/ /g, '_');
            envVars[winKey] = envVars[key];
        }
    }
    return envVars;
}

function handleDockerError(err: Error) {
    let message = err.message;
    if (os.platform() === 'win32') {
        if (message.includes('EPERM')) {
            message += '\\n请以管理员权限运行';
        }
        if (message.includes('ENOENT')) {
            message = message.replace(/\\\\/g, '/');
        }
    }
    return {
        content: [{ type: 'text', text: message }],
        isError: true
    };
}

export default async function (request: any) {
    try {
        const { action, image, dockerfile, containerId, portMapping, buildArgs, filters, pruneType, confirm, tag } = request.params.arguments;

        if (!action) {
            return { content: [{ type: "text", text: "Action is required." }], isError: true };
        }

        const docker = new Docker({
            socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
            version: 'v1.41'
        });

        switch (action) {
            case "build":
                if (!dockerfile || !image) {
                    return { content: [{ type: "text", text: "Dockerfile and image are required for build action." }], isError: true };
                }

                const dockerfilePath = normalizeDockerPath(path.resolve(dockerfile));
                const buildContext = await createBuildContext(dockerfilePath);
                const sanitizedBuildArgs = sanitizeBuildArgs(buildArgs || {});

                const buildOptions = {
                    t: image,
                    buildargs: sanitizedBuildArgs,
                    labels: { 'com.mcp.build': 'true' }
                };

                const stream = await docker.buildImage(buildContext, buildOptions);

                await new Promise((resolve, reject) => {
                    docker.modem.followProgress(stream, (err: any, res: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(res);
                        }
                    }, (event: any) => {
                        console.log(event.stream);
                    });
                });

                return {
                    content: [{ type: "text", text: `Image ${image} built successfully.` }]
                };
            case "run":
                if (!image) {
                    return { content: [{ type: "text", text: "Image name is required for run action." }], isError: true };
                }

                const runOptions: any = {};
                if (portMapping) {
                    runOptions.ExposedPorts = {};
                    runOptions.PortBindings = {};
                    portMapping.split(",").forEach((mapping: string) => {
                        const [hostPort, containerPort] = mapping.split(":");
                        runOptions.ExposedPorts[`${containerPort}/tcp`] = {};
                        runOptions.PortBindings[`${containerPort}/tcp`] = [{ HostPort: hostPort }];
                    });
                }

                const container = await docker.createContainer({
                    Image: image,
                    Tty: false,
                    ...runOptions
                });

                await container.start();

                const containerInfo = await container.inspect();
                const ports = containerInfo.NetworkSettings.Ports;
                const portMappings = Object.keys(ports).map(port => `${ports[port][0].HostPort}:${port.split('/')[0]}`).join(',');

                return { content: [{ type: "text", text: `Container ${container.id} started. Ports mapped: ${portMappings}` }] };
            case "stop":
                if (!containerId) {
                    return { content: [{ type: "text", text: "Container ID is required for stop action." }], isError: true };
                }
                const containerStop = docker.getContainer(containerId);
                await containerStop.stop();
                return { content: [{ type: "text", text: `Container ${containerId} stopped successfully.` }] };
            case "remove":
                if (!containerId) {
                    return { content: [{ type: "text", text: "Container ID is required for remove action." }], isError: true };
                }
                const containerRemove = docker.getContainer(containerId);
                await containerRemove.remove();
                return { content: [{ type: "text", text: `Container ${containerId} removed successfully.` }] };
            case "list":
                const filtersList = filters || {};
                const containers = await docker.listContainers({ all: true, filters: filtersList });
                const containerList = containers.map(container => {
                    return {
                        Id: container.Id,
                        Image: container.Image,
                        State: container.State,
                        Status: container.Status,
                        Names: container.Names
                    };
                });
                return { content: [{ type: "text", text: JSON.stringify(containerList, null, 2) }] };
            case "prune":
                if (!confirm) {
                    return { content: [{ type: "text", text: "Confirmation is required for prune action. Set confirm=true." }], isError: true };
                }
                const pruneTypeString = pruneType || "all";

                if (pruneTypeString === "image") {
                    const report = await docker.pruneImages({ filters: {} });
                    return { content: [{ type: "text", text: `Pruned images successfully. ${JSON.stringify(report, null, 2)}` }] };
                } else if (pruneTypeString === "container") {
                    const report = await docker.pruneContainers({ filters: {} });
                    return { content: [{ type: "text", text: `Pruned containers successfully. ${JSON.stringify(report, null, 2)}` }] };
                } else if (pruneTypeString === "all") {
                    const reportImages = await docker.pruneImages({ filters: {} });
                    const reportContainers = await docker.pruneContainers({ filters: {} });
                    return { content: [{ type: "text", text: `Pruned all successfully. Images: ${JSON.stringify(reportImages, null, 2)} Containers: ${JSON.stringify(reportContainers, null, 2)}` }] };
                } else {
                    return { content: [{ type: "text", text: "Invalid prune type. Choose 'image', 'container', or 'all'." }], isError: true };
                }
            case "tag":
                if (!tag || !tag.sourceImage || !tag.targetImage) {
                    return { content: [{ type: "text", text: "Source image and target image are required for tag action." }], isError: true };
                }

                const { sourceImage, targetImage, force } = tag;

                const source = docker.getImage(sourceImage);
                const target = docker.getImage(targetImage);
                try {
                    await target.inspect();
                    if (!force) {
                        return { content: [{ type: "text", text: `Target image '${targetImage}' already exists. Use force=true to overwrite.` }], isError: true };
                    }
                } catch (e: any) {
                    // Target image doesn't exist, which is fine.
                }

                const [repository, imageTag] = targetImage.includes(':') ? targetImage.split(':') : [targetImage, 'latest'];
                await source.tag({ repo: repository, tag: imageTag });
                return { content: [{ type: "text", text: `Image tagged successfully: ${sourceImage} → ${targetImage}` }] };
            default:
                return { content: [{ type: "text", text: "Invalid action." }], isError: true };
        }
    } catch (error: any) {
        console.error(error);
        return handleDockerError(error);
    }
}

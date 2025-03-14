import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { LogService } from '../logService.js';
import { tasksFilePath, ToolHandler } from '../index.js';

type ScheduledTask = {
    id: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
    executed: boolean;
    creationTime: string;
    timerId?: NodeJS.Timeout;
    result?: any;
    lastExecutionTime?: string;
} & (
        | {
            type: 'once_absolute';
            time: string; // ISO 8601 格式
        }
        | {
            type: 'once_relative';
            delaySeconds: number;
        }
        | {
            type: 'recurring';
            interval: string; // every@格式
            startTime?: string; // ISO 8601 格式
        }
    );


let scheduledTasks: ScheduledTask[] = [];

// 加载定时任务
function loadTasks() {
    try {
        const data = fs.readFileSync(tasksFilePath, 'utf8');
        try {
            const parsedTasks = JSON.parse(data);
            scheduledTasks = parsedTasks.map((task: any) => {
                if (task.type === 'once_absolute' && !task.time) {
                    return null;
                } else if (task.type === 'once_relative' && !task.delaySeconds) {
                    return null;
                } else if (task.type === 'recurring' && !task.interval) {
                    return null;
                }
                return task as ScheduledTask;
            }).filter(task => task !== null) as ScheduledTask[];
        } catch (parseError) {
            scheduledTasks = [];
        }
    } catch (error) {
        scheduledTasks = [];
    }
}

// 保存定时任务
function saveTasks() {
    try {
        // 排除 timerId 属性，避免循环引用
        const tasksToSave = scheduledTasks.map(task => {
            const { timerId, ...taskWithoutTimerId } = task;
            return taskWithoutTimerId;
        });
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasksToSave, null, 2), 'utf8');
    } catch (error) {
    }
}

// 创建定时器
async function createTask(task: ScheduledTask) {
    scheduledTasks.push(task);
    saveTasks();
    await scheduleTask(task);
}

// 取消定时器
function cancelTask(id: string) {
    const taskToCancel = scheduledTasks.find(task => task.id === id);
    if (taskToCancel && taskToCancel.timerId) {
        clearTimeout(taskToCancel.timerId);
        if (taskToCancel.type === 'recurring') {
            clearInterval(taskToCancel.timerId);
        }
    }
    scheduledTasks = scheduledTasks.filter(task => task.id !== id);
    saveTasks();
}


// 执行定时器
async function executeTask(task: ScheduledTask) {
    const start = Date.now();
    try {
        await ToolHandler[task.toolName]({ params: { arguments: task.toolArgs } });
        task.executed = true;
        task.lastExecutionTime = new Date().toISOString();
        saveTasks();
        LogService.log({
            ts: new Date().toISOString(),
            tool: task.toolName,
            args: task.toolArgs,
            stat: 'success',
            cost: Date.now() - start,
            tid: task.id
        });
    } catch (error: any) {
        LogService.log({
            ts: new Date().toISOString(),
            tool: task.toolName,
            args: task.toolArgs,
            stat: 'error',
            err: error.message,
            trace: error.stack,
            cost: Date.now() - start,
            tid: task.id
        });
    }
}

// 调度定时任务
async function scheduleTask(task: ScheduledTask) {
    switch (task.type) {
        case 'once_absolute':
            const targetTime = new Date(task.time);
            const delay = targetTime.getTime() - Date.now();
            if (delay > 0) {
                task.timerId = setTimeout(async () => {
                    await executeTask(task);
                }, delay);
            }
            break;
        case 'once_relative':
            const delaySeconds = task.delaySeconds;
            const delayMs = delaySeconds * 1000;
            task.timerId = setTimeout(async () => {
                await executeTask(task);
            }, delayMs);
            break;
        case 'recurring':
            const interval = task.interval;
            const num = parseInt(interval.substring(6));
            const unit = interval.slice(String(num).length + 6);
            let intervalMs = 0;

            if (unit === 's') {
                intervalMs = num * 1000;
            } else if (unit === 'm') {
                intervalMs = num * 60 * 1000;
            }

            let initialDelay = 0;
            if (task.startTime) {
                const startTime = new Date(task.startTime);
                initialDelay = startTime.getTime() - Date.now();
                if (initialDelay < 0) {
                    initialDelay = 0;
                }
            }

            task.timerId = setTimeout(async () => {
                await executeTask(task);
                // 清除旧的timeout并创建interval
                if (task.timerId) {
                    clearTimeout(task.timerId);
                }
                const intervalId = setInterval(async () => {
                    await executeTask(task);
                }, intervalMs);
                task.timerId = intervalId;
                saveTasks(); // 保存新的timerId
            }, initialDelay);
            break;
    }
}

//  启动时加载所有定时任务
loadTasks();
scheduledTasks.forEach(task => scheduleTask(task));

export const schema = {
    name: "schedule_tool",
    description: "Manage scheduled tasks with create/cancel/list operations",
    type: "object",
    properties: {
        action: {
            type: "string",
            enum: ["create", "cancel", "list", "cancel_all_once", "cancel_all_recurring"],
            description: "Action type (create/cancel/list tasks)"
        },
        time: {
            type: "string",
            description: "Absolute execution time in 'YYYY-MM-DD HH:mm:ss' format"
        },
        delaySeconds: {
            type: "number",
            description: "Delay execution by N seconds (e.g. 300 for 5 minutes)"
        },
        interval: {
            type: "string",
            description: "Recurring interval pattern (e.g. 'every@5m' for 5 minutes, 'every@30s' for 30 seconds)"
        },
        toolName: {
            description: "Name of the tool to execute (e.g. 'time_tool')"
        },
        toolArgs: {
            type: "object",
            description: "Parameters for the target tool"
        },
        id: {
            type: "string",
            description: "Task ID (required for cancellation)"
        }
    },
    required: ["action"],
    outputSchema: {
        type: "object",
        properties: {
            content: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            description: "The content type (e.g., 'text')."
                        },
                        text: {
                            type: "string",
                            description: "The query result in JSON string format."
                        }
                    },
                    required: ["type", "text"]
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
    const action = request.params.arguments?.action;
    const toolName = request.params.arguments?.toolName;
    const toolArgs = request.params.arguments?.toolArgs;
    const id = request.params.arguments?.id;

    const messages = {
        taskCreated: (id: string) => `Scheduled task created. ID: ${id}`,
        taskCanceled: (id: string) => `Task canceled. ID: ${id}`,
        allOnceTasksCleared: "All one-time tasks cleared",
        allRecurringCleared: "All recurring tasks cleared",
        invalidTime: "Scheduled time must be in the future",
        missingParams: "Missing required parameters: time/delaySeconds/interval",
        invalidAction: "Invalid action type"
    };

    switch (action) {
        case "create":
            let newTask: ScheduledTask;
            const { time, delaySeconds, interval } = request.params.arguments;

            if (time && time.startsWith('every@')) {
                newTask = {
                    id: uuidv4(),
                    toolName: toolName,
                    toolArgs: toolArgs,
                    executed: false,
                    creationTime: new Date().toISOString(),
                    type: 'recurring',
                    interval: time,
                };
            } else if (time) {
                const targetTime = new Date(time);
                const timeDiff = targetTime.getTime() - Date.now();
                if (timeDiff <= 0) {
                    throw new Error("Scheduled time must be in the future");
                }
                newTask = {
                    id: uuidv4(),
                    toolName: toolName,
                    toolArgs: toolArgs,
                    executed: false,
                    creationTime: new Date().toISOString(),
                    type: 'once_absolute',
                    time: time,
                };
            } else if (delaySeconds) {
                newTask = {
                    id: uuidv4(),
                    toolName: toolName,
                    toolArgs: toolArgs,
                    executed: false,
                    creationTime: new Date().toISOString(),
                    type: 'once_relative',
                    delaySeconds: delaySeconds,
                };
            } else if (interval) {
                newTask = {
                    id: uuidv4(),
                    toolName: toolName,
                    toolArgs: toolArgs,
                    executed: false,
                    creationTime: new Date().toISOString(),
                    type: 'recurring',
                    interval: interval,
                };
            }
            else {
                throw new Error("Missing required parameters: time/delaySeconds/interval");
            }
            await createTask(newTask);
            return {
                content: [
                    {
                        type: "text",
                        text: messages.taskCreated(newTask.id),
                    },
                ],
            };
        case "cancel":
            if (!id) {
                throw new Error("Missing parameter: id");
            }
            cancelTask(id);
            return {
                content: [
                    {
                        type: "text",
                        text: messages.taskCanceled(id),
                    },
                ],
            };
        case "list":
            const tasksWithoutTimerId = scheduledTasks.map(task => {
                const { timerId, ...taskWithoutTimerId } = task;
                return taskWithoutTimerId;
            });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(tasksWithoutTimerId, null, 2),
                    },
                ],
            };
        case "cancel_all_once":
            scheduledTasks.forEach(task => {
                if ((task.type === 'once_absolute' || task.type === 'once_relative') && task.timerId) {
                    clearTimeout(task.timerId);
                }
            });
            scheduledTasks = scheduledTasks.filter(task => task.type !== 'once_absolute' && task.type !== 'once_relative');
            saveTasks();
            return {
                content: [
                    {
                        type: "text",
                        text: messages.allOnceTasksCleared,
                    },
                ],
            };
        case "cancel_all_recurring":
            scheduledTasks.forEach(task => {
                if (task.type === 'recurring' && task.timerId) {
                    clearInterval(task.timerId); // 新增清理定时器逻辑
                }
            });
            scheduledTasks = scheduledTasks.filter(task => task.type !== 'recurring');
            saveTasks();
            return {
                content: [
                    {
                        type: "text",
                        text: messages.allRecurringCleared,
                    },
                ],
            };
        default:
            throw new Error(messages.invalidAction);
    }
};

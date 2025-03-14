import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { ToolHandler } from '../index.js';

interface ScheduledTask {
    id: string;
    time: string; //  YYYY-MM-DD HH:mm:ss, every@Nm (every N minutes), every@Ns (every N seconds)
    toolName: string;
    toolArgs: any;
    result?: any;
    executed: boolean;
    lastExecutionTime?: string;
    interval?: string; // every@Nm or every@Ns, 为空表示一次性定时器
    creationTime: string; // 定时器创建时间
    type: 'once' | 'recurring'; // 定时器类型：一次性或循环
    timerId?: any; // 定时器 ID
}


const tasksFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../build/scheduled_tasks.json');

let scheduledTasks: ScheduledTask[] = [];

// 加载定时任务
function loadTasks() {
    try {
        if (!fs.existsSync(tasksFilePath)) {
            fs.writeFileSync(tasksFilePath, '[]', 'utf8');
            console.log('定时任务文件不存在，已创建空文件');
        }
        const data = fs.readFileSync(tasksFilePath, 'utf8');
        try {
            scheduledTasks = JSON.parse(data);
            console.log('定时任务加载成功');
        } catch (parseError) {
            console.error('定时任务解析失败:', parseError);
            scheduledTasks = [];
        }
    } catch (error) {
        console.error('加载定时任务失败:', error);
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
        console.log('定时任务保存成功');
    } catch (error) {
        console.error('保存定时任务失败:', error);
    }
}

// 创建定时器
async function createTask(task: ScheduledTask) {
    scheduledTasks.push(task);
    saveTasks();
    console.log(`创建定时任务 ${task.id}`);
    await scheduleTask(task);
}

// 取消定时器
function cancelTask(id: string) {
    scheduledTasks = scheduledTasks.filter(task => task.id !== id);
    saveTasks();
    console.log(`取消定时任务 ${id}`);
    // TODO:  需要清除定时器
}

// 执行定时器
async function executeTask(task: ScheduledTask) {
    try {
        const result = await ToolHandler[task.toolName]({ params: { arguments: task.toolArgs } });
        task.result = result;
        task.executed = true;
        task.lastExecutionTime = new Date().toISOString();
        saveTasks();
        console.log(`执行定时任务 ${task.id}`);
    } catch (error) {
        console.error(`执行定时任务 ${task.id} 失败:`, error);
    }
}

// 调度定时任务
async function scheduleTask(task: ScheduledTask) {
    const now = new Date();
    const creationTime = new Date(task.creationTime);
    let delay = 0;

    if (task.time.startsWith('every@')) {
        const interval = task.time.substring(6);
        let num = parseInt(interval);
        let unit = interval.slice(String(num).length);

        if (unit === 's') {
            delay = num * 1000;
        } else if (unit === 'm') {
            delay = num * 60 * 1000;
        }

        if (task.interval) {
            // 循环定时器
            task.timerId = setInterval(async () => {
                await executeTask(task);
            }, delay);
        } else {
            // 一次性定时器
            task.timerId = setTimeout(async () => {
                await executeTask(task);
            }, delay);
        }
    } else {
        //  指定时间执行
        const targetTime = new Date(task.time);
        delay = targetTime.getTime() - now.getTime();
        if (delay > 0) {
            task.timerId = setTimeout(async () => {
                await executeTask(task);
            }, delay);
        }
    }
}

//  启动时加载所有定时任务
loadTasks();
scheduledTasks.forEach(task => scheduleTask(task));

export const schema = {
    name: "schedule_tool",
    description: "Manage scheduled tasks, supporting create/cancel/list",
    type: "object",
    properties: {
        action: {
            type: "string",
            enum: ["create", "cancel", "list", "cancel_all_once", "cancel_all_recurring"],
            description: "Action type",
        },
        time: {
            type: "string",
            description: "Time format: YYYY-MM-DD HH:mm:ss, every@Nm (every N minutes), every@Ns (every N seconds)",
        },
       interval: {
            type: "string",
            description: "Interval format: every@Nm (every N minutes), every@Ns (every N seconds)",
        },
       toolName: {
            description: "Name of the tool to execute",
        },
        toolArgs: {
            type: "object",
            description: "Tool parameters",
        },
        id: {
            type: "string",
            description: "Task ID (required for cancellation)",
        },
    },
    required: ["action"],
};

export default async (request: any) => {
    const action = request.params.arguments?.action;
    const time = request.params.arguments?.time;
    const toolName = request.params.arguments?.toolName;
    const toolArgs = request.params.arguments?.toolArgs;
    const id = request.params.arguments?.id;

    switch (action) {
        case "create":
            if (!time || !toolName || !toolArgs) {
                throw new Error("缺少参数：time, toolName, toolArgs");
            }
            const newTask: ScheduledTask = {
                id: uuidv4(),
                time: time,
                toolName: toolName,
                toolArgs: toolArgs,
                executed: false,
                creationTime: new Date().toISOString(),
                interval: time.startsWith('every@') ? time : undefined,
                type: time.startsWith('every@') ? 'recurring' : 'once',
            };
            await createTask(newTask);
            return {
                content: [
                    {
                        type: "text",
                        text: `创建定时任务成功，任务ID：${newTask.id}`,
                    },
                ],
            };
        case "cancel":
            if (!id) {
                throw new Error("缺少参数：id");
            }
            cancelTask(id);
            return {
                content: [
                    {
                        type: "text",
                        text: `取消定时任务成功，任务ID：${id}`,
                    },
                ],
            };
        case "list":
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(scheduledTasks, null, 2),
                    },
                ],
            };
        case "cancel_all_once":
            scheduledTasks = scheduledTasks.filter(task => task.type !== 'once');
            saveTasks();
            return {
                content: [
                    {
                        type: "text",
                        text: `取消所有一次性定时任务成功`,
                    },
                ],
            };
        case "cancel_all_recurring":
            scheduledTasks = scheduledTasks.filter(task => task.type !== 'recurring');
            saveTasks();
            return {
                content: [
                    {
                        type: "text",
                        text: `取消所有循环定时任务成功`,
                    },
                ],
            };
        default:
            throw new Error("未知操作类型");
    }
};

import cron from 'node-cron';
import notifier from 'node-notifier';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ToolHandler } from '../index.js';

type ScheduledTask = {
  id: string;
  time: string;
  message: string;
  cronExpression: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
};

const TASKS_FILE = path.join(fileURLToPath(import.meta.url), '../../scheduled_tasks.json');
const tasksMap: { [id: string]: cron.ScheduledTask } = {};
let tasks: ScheduledTask[] = [];

/** schedule_tool 工具的参数列表 */
export const schema = {
  name: "schedule_tool",
  description: "Manage scheduled tasks, supporting create/cancel/list",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["create", "cancel", "list"],
      description: "Action type"
    },
    time: {
      type: "string",
      description: "Time format: weekly@EEE@HH:mm, monthly@DD@HH:mm, now+Nm (N minutes later), now+Ns (N seconds later), once@YYYY-MM-DD HH:mm, once@HH:mm"
    },
    message: {
      type: "string",
      description: "Reminder message content"
    },
    id: {
      type: "string",
      description: "Task ID (required for cancellation)"
    },
    tool_name: {
      type: "string",
      description: "Name of the tool to execute"
    },
    tool_args: {
      type: "object",
      description: "Tool parameters"
    }
  },
  required: ["action"],
  dependencies: {
    action: {
      oneOf: [
        { const: "create", required: ["time", "message"] },
        { const: "cancel", required: ["id"] }
      ]
    }
  }
};

async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    tasks = JSON.parse(data);
  } catch (error) {
    tasks = [];
  }
}

async function saveTasks() {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

function parseTime(timeStr: string): string {
  if (timeStr === 'now+1') {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${minutes} ${hours} * * *`;
  } else if (timeStr.startsWith('now+')) {
    const now = new Date();
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(3, -1));
    if (unit === 'm') {
      now.setMinutes(now.getMinutes() + value);
    } else if (unit === 's') {
      now.setSeconds(now.getSeconds() + value);
    }
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return `${seconds} ${minutes} ${hours} * * *`;
  }

  const now = new Date();

  if (timeStr.includes('once@')) {
    const [_, dateTime] = timeStr.split('@');
    const [datePart, timePart] = dateTime.split(' ');
    let year, month, day, hours, minutes;

    if (dateTime.includes('-')) {
      // YYYY-MM-DD HH:mm 格式
      const [date, time] = dateTime.split(' ');
      [year, month, day] = date.split('-').map(Number);
      [hours, minutes] = time.split(':').map(Number);
    } else {
      // HH:mm 格式
      [hours, minutes] = dateTime.split(':').map(Number);
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
      day = now.getDate();
    }

    return `${minutes} ${hours} ${day} ${month} *`;
  }

  if (timeStr.includes('weekly@')) {
    const [_, dayOfWeek, time] = timeStr.split('@');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayIndex = days.indexOf(dayOfWeek);
    const [hours, minutes] = time.split(':').map(Number);
    return `${minutes} ${hours} * * ${dayIndex}`;
  }

  if (timeStr.includes('monthly@')) {
    const [_, day, time] = timeStr.split('@');
    const [hours, minutes] = time.split(':').map(Number);
    return `${minutes} ${hours} ${day} * *`;
  }

  if (timeStr === 'now+1') {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${minutes} ${hours} * * *`;
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  return `${minutes} ${hours} * * *`;
}

function scheduleJob(task: ScheduledTask) {
  const job = cron.schedule(task.cronExpression, async () => {
    notifier.notify({
      title: 'MCP Reminder',
      message: task.message,
      sound: true
    });

    if (task.toolName && ToolHandler[task.toolName]) {
      await ToolHandler[task.toolName]({ params: { arguments: task.toolArgs } });
    }
  });
  tasksMap[task.id] = job;
}

export default async (request: any) => {
  await loadTasks();
  const { action, id, time, message, tool_name, tool_args } = request.params.arguments;

  try {
    switch (action) {
      case 'create': {
        const taskId = id || randomUUID();
        const cronExpression = parseTime(time);

        const newTask = {
          id: taskId,
          time,
          message,
          cronExpression,
          toolName: tool_name,
          toolArgs: tool_args
        };

        tasks.push(newTask);
        scheduleJob(newTask);
        await saveTasks();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ id: taskId, status: 'created' })
          }]
        };
      }

      case 'cancel': {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) throw new Error("任务不存在");

        tasksMap[id]?.stop();
        delete tasksMap[id];
        tasks.splice(taskIndex, 1);
        await saveTasks();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ id, status: 'cancelled' })
          }]
        };
      }

      case 'list': {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks.map(t => ({
              id: t.id,
              time: t.time,
              message: t.message,
              tool_name: t.toolName,
              tool_args: t.toolArgs
            })))
          }]
        };
      }

      default:
        throw new Error("无效操作");
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : '未知错误'
      }],
      isError: true
    };
  }
};

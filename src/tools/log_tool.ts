import fs from 'fs';
import readline from 'readline';
import { logFile } from '../config.js';

export const schema = {
  name: 'log_tool',
  description: 'Query logs with filtering and pagination',
  type: 'object',
  properties: {
    pageSize: {
      type: 'number',
      description: 'Logs per page (1-100)',
      minimum: 1,
      maximum: 100,
      default: 10
    },
    page: {
      type: 'number',
      description: 'Page number (>= 1)',
      minimum: 1,
      default: 1
    },
    toolName: {
      type: 'string',
      description: 'Regex to match tool name',
    },
    status: {
      type: 'string',
      description: 'Log status (success or error)',
      enum: ['success', 'error'],
    },
    minDuration: {
      type: 'number',
      description: 'Minimum duration (ms)',
    },
    maxDuration: {
      type: 'number',
      description: 'Maximum duration (ms)',
    },
    startTime: {
      type: 'string',
      description: 'Start time (ISO8601)',
    },
    endTime: {
      type: 'string',
      description: 'End time (ISO8601)',
    },
  },
  required: []
};

interface LogEntry {
  ts: string;
  args: object;
  cost: number;
  stat: string;
  tool: string;
}

export default async (request: any): Promise<{ content: any[]; isError?: boolean }> => {
  try {
    const params = request.params.arguments;
    let { pageSize, page, toolName, status, minDuration, maxDuration, startTime, endTime } = params;

    // Parameter preprocessing
    pageSize = Math.min(pageSize || 10, 100);
    page = Math.max(page || 1, 1);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const paginatedLogs: LogEntry[] = [];
    let matchedCount = 0;

    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      return { content: [{ type: 'text', text: JSON.stringify([], null, 2) }] };
    }

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        if (line.trim() === '') continue;
        const logEntry: LogEntry = JSON.parse(line);
        logEntry.tool = logEntry.tool || 'unknown';

        // Apply filters
        if (toolName && !new RegExp(toolName).test(logEntry.tool)) continue;
        if (status && logEntry.stat !== status) continue;
        if (minDuration && logEntry.cost < minDuration) continue;
        if (maxDuration && logEntry.cost > maxDuration) continue;
        if (startTime && new Date(logEntry.ts) < new Date(startTime)) continue;
        if (endTime && new Date(logEntry.ts) > new Date(endTime)) continue;

        // If filters pass, check for pagination
        if (matchedCount >= skip) {
          paginatedLogs.push(logEntry);
        }
        
        matchedCount++;

        // If the page is full, stop reading
        if (paginatedLogs.length >= take) {
          rl.close();
          fileStream.destroy();
          break;
        }
      } catch (parseError) {
        // Ignore lines that are not valid JSON
      }
    }

    return { content: [{ type: 'text', text: JSON.stringify(paginatedLogs, null, 2) }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: JSON.stringify(`Query failed: ${error.message}`, null, 2) }], isError: true };
  }
};

// Destroy function
export async function destroy() {
  // Release resources, stop timers, disconnect, etc.
  console.log("Destroy log_tool");
}

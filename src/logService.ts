import fs from 'fs';
import os from 'os';
import { logFile } from './index.js';

interface LogEntry {
  ts: string;
  tool: string;
  args: any;
  stat: string;
  cost?: number;
  err?: string;
  trace?: string;
  tid?: string;
  trigTs?: string;
}

export class LogService {
  static log(logEntry: LogEntry) {
    const logString = JSON.stringify(logEntry) + os.EOL;
    fs.appendFile(logFile, logString, (err) => { });
  }
}

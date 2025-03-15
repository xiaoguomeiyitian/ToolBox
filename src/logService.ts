import fs from 'fs';
import os from 'os';
import { logFile } from './config.js';

interface LogEntry {
  ts: string;
  tool: string;
  caller?: string;
  args: any;
  stat: string;
  cost?: number;
  err?: string;
  trace?: string;
}

export class LogService {
  static log(logEntry: LogEntry) {
    fs.appendFile(logFile, JSON.stringify(logEntry) + os.EOL, { encoding: 'utf8' }, (err) => { });
  }
}

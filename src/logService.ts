import fs from 'fs';
import os from 'os';
import path from 'path';
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
  private static ensureLogDirectory() {
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  static log(logEntry: LogEntry) {
    try {
      this.ensureLogDirectory();
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + os.EOL, { encoding: 'utf8' });
    } catch (error) {
      console.error(`Failed to write log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  static async logAsync(logEntry: LogEntry): Promise<void> {
    return new Promise((resolve) => {
      this.ensureLogDirectory();
      fs.appendFile(logFile, JSON.stringify(logEntry) + os.EOL, { encoding: 'utf8' }, (err) => {
        if (err) {
          console.error(`Failed to write log: ${err.message}`);
        }
        resolve();
      });
    });
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//工具目录
export const toolsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tools');
//log目录
const logDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'log');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });
export const logFile = path.join(logDirectory, 'ToolBox.log');
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '', 'utf8');
//json目录
const jsonDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'json');
if (!fs.existsSync(jsonDirectory)) fs.mkdirSync(jsonDirectory, { recursive: true });
export const tasksFilePath = path.join(jsonDirectory, 'scheduled_tasks.json');
if (!fs.existsSync(tasksFilePath)) fs.writeFileSync(tasksFilePath, '[]', 'utf8');
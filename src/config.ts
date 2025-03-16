import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//工具目录
export const toolsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tools');

// 获取当前文件所在目录
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// 判断是否是测试环境
const isTest = process.env.NODE_ENV === 'test';

// 目录
const dataDir = isTest ? path.join(currentDir, '..', 'test') : currentDir;

//log目录
export const logDirectory = path.join(dataDir, 'log');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });
export const logFile = path.join(logDirectory, 'ToolBox.log');
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '', 'utf8');

//json目录
const jsonDirectory = path.join(dataDir, 'json');
if (!fs.existsSync(jsonDirectory)) fs.mkdirSync(jsonDirectory, { recursive: true });
export const tasksFilePath = path.join(jsonDirectory, 'scheduled_tasks.json');
if (!fs.existsSync(tasksFilePath)) fs.writeFileSync(tasksFilePath, '[]', 'utf8');

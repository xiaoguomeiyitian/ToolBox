import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { sqlitePath } from '../config.js';

// 工具参数schema
export const schema = {
  name: "sqlite_tool",
  description: "A tool for performing SQLite database operations.",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["query", "transaction", "backup", "optimize", "index", "drop_index", "list_indexes", "table_info", "foreign_key_check", "integrity_check"],
      description: "The type of operation to perform."
    },
    dbName: {
      type: "string",
      description: "The name of the database file (without the .db extension)."
    },
    query: {
      type: "string",
      description: "The SQL query to execute."
    },
    params: {
      type: "array",
      description: "The parameters for the SQL query."
    },
    backupName: {
      type: "string",
      description: "The name of the backup file (without the .db extension)."
    },
    pagination: {
      type: "object",
      description: "Pagination configuration for queries.",
      properties: {
        page: {
          type: "number",
          minimum: 1,
          default: 1,
          description: "The page number."
        },
        pageSize: {
          type: "number",
          minimum: 1,
          maximum: 1000,
          default: 50,
          description: "The number of items per page."
        },
        countTotal: {
          type: "boolean",
          default: false,
          description: "Whether to count the total number of items."
        }
      }
    },
    tableName: {
      type: "string",
      description: "The name of the table to operate on."
    },
    indexName: {
      type: "string",
      description: "The name of the index to operate on."
    }
  },
  required: ["action", "dbName"],
  outputSchema: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      dataType: { type: "string", enum: ["text", "table"] },
      data: { type: "string" }
    },
    required: ["success", "dataType", "data"]
  }
};

// 连接池
const connectionPool = new Map<string, any>();

// 获取数据库连接
async function getDatabaseConnection(dbName: string) {
  const dbPath = path.join(sqlitePath, `${dbName}.db`);
  if (connectionPool.has(dbPath)) {
    return connectionPool.get(dbPath);
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("数据库连接失败", err);
    } else {
      console.log("数据库连接成功");
    }
  });
  connectionPool.set(dbPath, db);
  return db;
}

// 工具实现
export default async function(request: any) {
  try {
    const { action, dbName, query, params, backupName, pagination, tableName, indexName } = request.params.arguments;
    const db = await getDatabaseConnection(dbName);

    const executeQuery = (sql: string, params?: any[]) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) {
            reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
          } else {
            const result = rows ? JSON.stringify(rows, null, 2) : JSON.stringify('Success', null, 2);
            resolve({ content: [{ type: "text", text: result }], isError: false });
          }
        });
      });
    };

    switch (action) {
      case "query":
        if (!query) {
          throw new Error("查询语句不能为空");
        }
        return executeQuery(query, params);
      case "transaction":
        if (!query) {
          throw new Error("事务语句不能为空");
        }
        return new Promise((resolve, reject) => {
          db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run(query, params, (err) => {
              if (err) {
                db.run("ROLLBACK");
                reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
              } else {
                db.run("COMMIT", (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
                  } else {
                    resolve({ content: [{ type: "text", text: JSON.stringify(`Transaction completed successfully in database ${dbName}`, null, 2) }], isError: false });
                  }
                });
              }
            });
          });
        });
      case "backup":
        if (!backupName) {
          throw new Error("备份名称不能为空");
        }
        return new Promise((resolve, reject) => {
          const dbPath = path.join(sqlitePath, `${dbName}.db`);
          const backupPath = path.join(sqlitePath, `${backupName}.db`);
          fs.copyFile(dbPath, backupPath, (err) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              resolve({ content: [{ type: "text", text: JSON.stringify(`Database ${dbName} backed up to ${backupName}.db`, null, 2) }], isError: false });
            }
          });
        });
      case "optimize":
        return new Promise((resolve, reject) => {
          db.run("VACUUM", (err) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              resolve({ content: [{ type: "text", text: JSON.stringify(`Database ${dbName} optimized`, null, 2) }], isError: false });
            }
          });
        });
      case "index":
        if (!query) {
          throw new Error("索引语句不能为空");
        }
        return new Promise((resolve, reject) => {
          db.run(query, (err) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              resolve({ content: [{ type: "text", text: JSON.stringify(`Index created successfully for database ${dbName}`, null, 2) }], isError: false });
            }
          });
        });
      case "drop_index":
        if (!indexName) {
          throw new Error("索引名称不能为空");
        }
        return new Promise((resolve, reject) => {
          db.run(`DROP INDEX IF EXISTS ${indexName}`, (err) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              resolve({ content: [{ type: "text", text: JSON.stringify(`Index ${indexName} dropped successfully from database ${dbName}`, null, 2) }], isError: false });
            }
          });
        });
       case "list_indexes":
        if (!tableName) {
          throw new Error("表名称不能为空");
        }
        return new Promise((resolve, reject) => {
          db.all(`PRAGMA index_list(${tableName})`, (err, rows) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              const formattedRows = rows.map(row => ({ name: row.name, table: tableName, unique: row.unique }));
              const result = JSON.stringify(formattedRows, null, 2);
              resolve({ content: [{ type: "text", text: result }], isError: false });
            }
          });
        });
      case "table_info":
        if (!tableName) {
          throw new Error("表名称不能为空");
        }
        return new Promise((resolve, reject) => {
          db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              resolve({ content: [{ type: "text", text: JSON.stringify(rows, null, 2) }], isError: false });
            }
          });
        });
      case "foreign_key_check":
        return new Promise((resolve, reject) => {
          db.all(`PRAGMA foreign_key_check`, (err, rows) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              resolve({ content: [{ type: "text", text: JSON.stringify(rows, null, 2) }], isError: false });
            }
          });
        });
      case "integrity_check":
        return new Promise((resolve, reject) => {
          db.all(`PRAGMA integrity_check`, (err, rows) => {
            if (err) {
              reject({ content: [{ type: "text", text: JSON.stringify(`Error: ${err.message}`, null, 2) }], isError: true });
            } else {
              resolve({ content: [{ type: "text", text: JSON.stringify(`Integrity check passed for database ${dbName}`, null, 2) }], isError: false });
            }
          });
        });
      default:
        throw new Error(`不支持的操作类型: ${action}`);
    }
  } catch (error) {
    return { content: [{ type: "text", text: JSON.stringify(`Error: ${error instanceof Error ? error.message : String(error)}`, null, 2) }], isError: true };
  }
}

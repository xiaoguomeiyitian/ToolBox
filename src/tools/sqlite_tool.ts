import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { sqlitePath } from '../config.js';

export const schema = {
  name: "sqlite_tool",
  description: "执行SQLite数据库操作，包括查询、事务、备份和索引管理。",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["query", "transaction", "backup", "optimize", "index", "drop_index", "list_indexes", "table_info", "foreign_key_check", "integrity_check"],
      description: "要执行的操作类型"
    },
    dbName: {
      type: "string",
      description: "数据库文件名 (不含扩展名)"
    },
    query: {
      type: "string",
      description: "要执行的SQL查询语句"
    },
    params: {
      type: "array",
      description: "SQL查询的参数"
    },
    backupName: {
      type: "string",
      description: "备份文件名 (不含扩展名)"
    },
    tableName: {
      type: "string",
      description: "表名"
    },
    indexName: {
      type: "string",
      description: "索引名"
    }
  },
  required: ["action", "dbName"]
};

const connectionPool = new Map<string, any>();

function getDatabaseConnection(dbName: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(sqlitePath, `${dbName}.db`);
    if (connectionPool.has(dbPath)) {
      resolve(connectionPool.get(dbPath));
      return;
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`数据库连接失败: ${err.message}`));
      } else {
        connectionPool.set(dbPath, db);
        resolve(db);
      }
    });
  });
}

function closeDatabaseConnection(dbName: string): Promise<void> {
  return new Promise((resolve) => {
    const dbPath = path.join(sqlitePath, `${dbName}.db`);
    if (connectionPool.has(dbPath)) {
      const db = connectionPool.get(dbPath);
      db.close(() => {
        connectionPool.delete(dbPath);
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export default async function(request: any) {
  let db: sqlite3.Database | null = null;
  try {
    const { action, dbName, query, params, backupName, tableName, indexName } = request.params.arguments;
    db = await getDatabaseConnection(dbName);

    const executeQuery = (sql: string, queryParams?: any[]): Promise<any> => {
      return new Promise((resolve, reject) => {
        db!.all(sql, queryParams, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ content: [{ type: "text", text: JSON.stringify(rows || 'Success', null, 2) }] });
          }
        });
      });
    };

    const executeRun = (sql: string, runParams?: any[]): Promise<any> => {
        return new Promise((resolve, reject) => {
            db!.run(sql, runParams, function(err) { // Use function() to get `this` context
                if (err) {
                    reject(err);
                } else {
                    resolve({ content: [{ type: "text", text: JSON.stringify({ lastID: this.lastID, changes: this.changes }, null, 2) }] });
                }
            });
        });
    };

    switch (action) {
      case "query":
        if (!query) throw new Error("参数 'query' 不能为空。");
        return await executeQuery(query, params);

      case "transaction":
        if (!query) throw new Error("参数 'query' 不能为空。");
        await executeRun("BEGIN TRANSACTION");
        try {
          const result = await executeRun(query, params);
          await executeRun("COMMIT");
          return result;
        } catch (err) {
          await executeRun("ROLLBACK");
          throw err; // Re-throw to be caught by the main catch block
        }

      case "backup":
        if (!backupName) throw new Error("参数 'backupName' 不能为空。");
        const dbPath = path.join(sqlitePath, `${dbName}.db`);
        const backupPath = path.join(sqlitePath, `${backupName}.db`);
        await fs.promises.copyFile(dbPath, backupPath);
        return { content: [{ type: "text", text: `数据库 ${dbName} 已成功备份至 ${backupName}.db` }] };

      case "optimize":
        return await executeRun("VACUUM");

      case "index":
        if (!query) throw new Error("参数 'query' 不能为空。");
        return await executeRun(query);

      case "drop_index":
        if (!indexName) throw new Error("参数 'indexName' 不能为空。");
        // Sanitize indexName to prevent SQL injection
        const sanitizedIndexName = indexName.replace(/[^a-zA-Z0-9_]/g, '');
        return await executeRun(`DROP INDEX IF EXISTS ${sanitizedIndexName}`);

      case "list_indexes":
        if (!tableName) throw new Error("参数 'tableName' 不能为空。");
        return await executeQuery(`PRAGMA index_list(${tableName})`);

      case "table_info":
        if (!tableName) throw new Error("参数 'tableName' 不能为空。");
        return await executeQuery(`PRAGMA table_info(${tableName})`);

      case "foreign_key_check":
        return await executeQuery(`PRAGMA foreign_key_check`);

      case "integrity_check":
        return await executeQuery(`PRAGMA integrity_check`);

      default:
        throw new Error(`不支持的操作类型: ${action}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true
    };
  } finally {
    if (db && request.params.arguments.dbName) {
      await closeDatabaseConnection(request.params.arguments.dbName);
    }
  }
}

export async function destroy() {
  const allConnections = Array.from(connectionPool.keys());
  for (const dbPath of allConnections) {
    const dbName = path.basename(dbPath, '.db');
    await closeDatabaseConnection(dbName);
  }
  console.log("Destroy sqlite_tool: All connections closed.");
}

# MCP 服务器集成方案：跨工具工作流引擎

## 一、工具定义文件 `src/tools/workflow_orchestrator.ts`

### 1. Schema 定义
```typescript
export const schema = {
  name: "workflow_orchestrator",
  description: "可视化工具调用链执行引擎",
  type: "object",
  properties: {
    workflow: {
      type: "object",
      description: "工作流定义",
      properties: {
        version: { 
          type: "string", 
          pattern: "^\\d+\\.\\d+$",
          example: "1.0" 
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tool: { 
                type: "string",
                description: "工具名称（需已注册）"
              },
              params: {
                type: "object",
                description: "工具参数（支持动态变量）"
              },
              retry: {
                type: "object",
                properties: {
                  attempts: { type: "number", minimum: 1 },
                  delay: { type: "number", minimum: 0 }
                }
              }
            },
            required: ["tool"]
          }
        }
      },
      required: ["version", "steps"]
    }
  },
  required: ["workflow"],
  outputSchema: {
    type: "object",
    properties: {
      content: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { 
              type: "string",
              enum: ["execution_log", "error_report"] 
            },
            text: { type: "string" }
          }
        }
      },
      isError: { type: "boolean" }
    }
  }
};


import { callToolHandler } from '../handler/ToolHandler.js';

interface WorkflowContext {
  variables: Record<string, any>;
  executionLog: Array<{ tool: string; status: string }>;
}

export default async function(request: any) {
  try {
    const { workflow } = request.params.arguments;
    const context: WorkflowContext = {
      variables: {},
      executionLog: []
    };

    // 动态变量解析器
    const resolveVariables = (params: any) => {
      return JSON.parse(JSON.stringify(params), (_, value) => {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
          const path = value.slice(2, -2).trim().split('.');
          return path.reduce((acc, key) => acc?.[key], context);
        }
        return value;
      });
    };

    for (const [index, step] of workflow.steps.entries()) {
      const callerId = `workflow_${Date.now()}_step${index + 1}`;
      
      try {
        const resolvedParams = resolveVariables(step.params);
        
        const result = await callToolHandler(
          {
            params: {
              name: step.tool,
              arguments: resolvedParams
            }
          },
          callerId
        );

        context.variables[`step_${index}`] = result.content;
        context.executionLog.push({
          tool: step.tool,
          status: 'success'
        });

      } catch (error) {
        context.executionLog.push({
          tool: step.tool,
          status: `failed: ${error instanceof Error ? error.message : String(error)}`
        });

        if (step.retry) {
          for (let attempt = 1; attempt <= step.retry.attempts; attempt++) {
            await new Promise(res => setTimeout(res, step.retry.delay));
            try {
              await callToolHandler(...); // 重试逻辑
              break;
            } catch (retryError) {
              if (attempt === step.retry.attempts) throw retryError;
            }
          }
        } else {
          throw new Error(`Workflow failed at step ${index + 1}`);
        }
      }
    }

    return {
      content: [{
        type: "execution_log",
        text: JSON.stringify(context.executionLog, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "error_report",
        text: `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

export async function destroy() {
  // 清理定时器或长连接
}
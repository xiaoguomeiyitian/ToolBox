import { callToolHandler } from '../handler/ToolHandler.js';
import { logDirectory } from '../config.js';
import { promises as fs } from 'fs';
import path from 'path';

// Define parameter schema
export const schema = {
  name: "workflow_tool",
  description: "Orchestrate tools in serial/parallel workflows",
  type: "object",
  properties: {
    version: { 
      type: "string", 
      default: "1.0",
      description: "Workflow definition version (e.g., '1.0.1')" 
    },
    steps: {
      type: "array",
      description: "List of workflow steps",
      items: {
        type: "object",
        description: "Step configuration (tool, args, retry)",
        properties: {
          tool: { 
            type: "string",
            description: "Tool name (e.g., 'sftp_tool')" 
          },
          args: { 
            type: "object",
            description: "Tool parameters (e.g., {action:'upload'})" 
          },
          retry: { 
            type: "number", 
            default: 0,
            description: "Number of retries" 
          },
          timeout: { 
            type: "number",
            description: "Timeout (ms)" 
          },
          parallel: { 
            type: "boolean", 
            default: false,
            description: "Execute in parallel" 
          },
          compensation: {
            type: "object",
            description: "Compensation config (tool, args)",
            properties: {
              tool: { type: "string" },
              args: { type: "object" }
            }
          }
        }
      }
    },
    outputFile: {
      type: "string",
      description: "Path to output file (optional)"
    }
  },
  required: ["steps"]
};

function getOutputPath(outputFile?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultPath = path.join(logDirectory, `workflow_${timestamp}.json`);
  
  if (!outputFile) return defaultPath;
  
  return path.isAbsolute(outputFile) 
    ? outputFile
    : path.resolve(logDirectory, outputFile);
}

async function saveReport(report: any, outputPath: string) {
  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  } catch (error) {
    throw new Error(`文件写入失败：${error instanceof Error ? error.message : String(error)}`);
  }
}

// Implement tool logic
export default async function(request: any) {
  const steps = request.params.arguments.steps;
  const stepDetails = [];
  let workflowStatus = "success";
  const startTime = new Date().toISOString();
  let executionTime = 0;
  const outputPath = getOutputPath(request.params.arguments.outputFile);

  // Check for restricted tools
  const restrictedTools = ["buildReload_tool", "workflow_tool"];
  for (const step of steps) {
    if (restrictedTools.includes(step.tool)) {
      return {
        content: [
          {
            type: "text",
            text: `Workflow cannot include ${step.tool} tool.`
          }
        ],
        isError: true
      };
    }
  }

  try {
    for (const [index, step] of steps.entries()) {
      const stepResult = await executeStep(step, index);
      stepDetails.push(stepResult);
      if (stepResult.status === "failed") {
        workflowStatus = "failed";
      }
    }

    executionTime = new Date().getTime() - new Date(startTime).getTime();

    const report = { workflowStatus, executionTime, steps: stepDetails };
    await saveReport(report, outputPath);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            workflowStatus: workflowStatus,
            executionTime: executionTime,
            steps: stepDetails
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    console.error("Workflow failed:", error);
    workflowStatus = "failed";
    executionTime = new Date().getTime() - new Date(startTime).getTime();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(`Workflow failed: ${error instanceof Error ? error.message : String(error)}`, null, 2),
          workflowStatus: workflowStatus,
          executionTime: executionTime,
          steps: stepDetails
        }
      ],
      isError: true
    };
  }
}

async function executeStep(step, index) {
  const startTime = new Date().toISOString();
  let duration = 0;
  let result = null;
  let status = "success";
  let error = null;

  try {
    const start = Date.now();
    result = await callToolHandler({
      params: { name: step.tool, arguments: step.args }
    }, `workflow_tool_step_${index}`);
    duration = Date.now() - start;
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message : String(e);
    if (step.compensation) {
      try {
        await callToolHandler({
          params: { name: step.compensation.tool, arguments: step.compensation.args }
        }, `workflow_tool_compensation_${index}`);
      } catch (compensationError) {
        console.error(`Compensation failed for step ${index}:`, compensationError);
      }
    }
  }

  return {
    index: index,
    tool: step.tool,
    status: status,
    startTime: startTime,
    duration: duration,
    result: result,
    error: error
  };
}

// Destroy function
export async function destroy() {
  // Release resources, stop timers, disconnect, etc.
  console.log("Destroy workflow_tool");
}

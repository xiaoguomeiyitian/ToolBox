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
    parallel: {
      type: "boolean",
      default: false,
      description: "If true, executes all steps in parallel."
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
export default async function (request: any) {
  const { steps, outputFile, parallel = false } = request.params.arguments;
  let stepDetails: any[] = [];
  let workflowStatus = "success";
  const startTime = new Date().toISOString();
  let executionTime = 0;
  const outputPath = getOutputPath(outputFile);

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
    if (parallel) {
      // Parallel execution
      const promises = steps.map((step, index) => executeStep(step, index));
      const results = await Promise.all(promises);
      stepDetails = results;
      if (results.some(r => r.status === "failed")) {
        workflowStatus = "failed";
      }
    } else {
      // Serial execution
      for (const [index, step] of steps.entries()) {
        const stepResult = await executeStep(step, index);
        stepDetails.push(stepResult);
        if (stepResult.status === "failed") {
          workflowStatus = "failed";
          // In serial execution, we could choose to break here.
          // For now, we continue to allow compensation on later steps if needed.
        }
      }
    }

    executionTime = new Date().getTime() - new Date(startTime).getTime();

    // Sort by index for consistent reports, especially after parallel execution
    const sortedStepDetails = stepDetails.sort((a, b) => a.index - b.index);
    const report = { workflowStatus, executionTime, steps: sortedStepDetails };
    await saveReport(report, outputPath);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(report, null, 2)
        }
      ]
    };
  } catch (error) {
    console.error("Workflow failed:", error);
    workflowStatus = "failed";
    executionTime = new Date().getTime() - new Date(startTime).getTime();
    const finalReport = { workflowStatus, executionTime, error: error instanceof Error ? error.message : String(error), steps: stepDetails };
    await saveReport(finalReport, outputPath);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(finalReport, null, 2)
        }
      ],
      isError: true
    };
  }
}

async function executeStep(step: any, index: number) {
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

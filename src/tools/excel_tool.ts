import * as XLSX from 'xlsx';
import * as csv from 'fast-csv';
import * as fs from 'fs';
import * as path from 'path';

// Define parameter schema
export const schema = {
  name: "excel_tool",
  description: "Read and write Excel/CSV files",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["read", "write"],
      description: "Action to perform: read or write"
    },
    filePath: {
      type: "string",
      description: "Absolute path to the file"
    },
    format: {
      type: "string",
      enum: ["xlsx", "xls", "csv"],
      description: "File format: xlsx, xls, csv"
    },
    data: {
      type: "array",
      description: "Data to write (required for write action)",
      items: {
        type: "object",
        additionalProperties: true
      }
    },
    options: {
      type: "object",
      description: "Additional options",
      properties: {
        sheetName: {
          type: "string",
          description: "Sheet name for Excel files"
        },
        headerRow: {
          type: "boolean",
          description: "Include header row in output"
        }
      },
      additionalProperties: true
    }
  },
  required: ["action", "filePath", "format"]
};

interface ReadParams {
  filePath: string; // 绝对路径
  format: 'xlsx' | 'xls' | 'csv';
  dateConversion?: boolean; // 是否转换日期格式
}

interface WriteParams {
  filePath: string;
  data: Array<Record<string, any>>;
  format: 'xlsx' | 'xls' | 'csv';
  options?: {
    sheetName?: string;
    headerRow?: boolean;
  };
}

async function readXLSX(params: ReadParams) {
  try {
    const workbook = XLSX.read(fs.readFileSync(params.filePath), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(`Error reading XLSX file: ${error instanceof Error ? error.message : String(error)}`, null, 2),
        },
      ],
      isError: true,
    };
  }
}

async function writeXLSX(params: WriteParams) {
  try {
    const workbook = XLSX.utils.book_new();
    const sheetName = params.options?.sheetName || "Sheet1";
    const sheet = XLSX.utils.json_to_sheet(params.data);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, params.filePath);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(`XLSX file written successfully to ${params.filePath}`, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(`Error writing XLSX file: ${error instanceof Error ? error.message : String(error)}`, null, 2),
        },
      ],
      isError: true,
    };
  }
}

async function readCSV(params: ReadParams) {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(params.filePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve({
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        });
      })
      .on("error", (error) => {
        console.error(error);
        resolve({
          content: [
            {
              type: "text",
              text: JSON.stringify(`Error reading CSV file: ${error instanceof Error ? error.message : String(error)}`, null, 2),
            },
          ],
          isError: true,
        });
      });
  });
}

async function writeCSV(params: WriteParams) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(params.filePath);
    csv.write(params.data, { headers: params.options?.headerRow !== false })
      .pipe(ws)
      .on("finish", () => {
        resolve({
          content: [
            {
              type: "text",
              text: `CSV file written successfully to ${params.filePath}`,
            },
          ],
        });
      })
      .on("error", (error) => {
        console.error(error);
        resolve({
          content: [
            {
              type: "text",
              text: JSON.stringify(`Error writing CSV file: ${error instanceof Error ? error.message : String(error)}`, null, 2),
            },
          ],
          isError: true,
        });
      });
  });
}

// Implement tool logic
export default async function (request: any) {
  try {
    const { action, filePath, format, data, options } = request.params.arguments;

    // Validate file path
    if (!path.isAbsolute(filePath)) {
      throw new Error("File path must be absolute");
    }

    // Check if file exists for read action
    if (action === "read" && !fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: File not found - ${filePath}`,
          },
        ],
        isError: true
      };
    }

    if (action === "read") {
      // Read file logic
      switch (format) {
        case "xlsx":
        case "xls":
          return readXLSX({ filePath, format });
        case "csv":
          return readCSV({ filePath, format });
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } else if (action === "write") {
      // Write file logic
      switch (format) {
        case "xlsx":
        case "xls":
          return writeXLSX({ filePath, data, format, options });
        case "csv":
          return writeCSV({ filePath, data, format, options });
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } else {
      throw new Error(`Invalid action: ${action}`);
    }
  } catch (error: any) {
    // Error handling
    console.error(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(`Error: ${error instanceof Error ? error.message : String(error)}`, null, 2),
        },
      ],
      isError: true
    };
  }
}

// Destroy function
export async function destroy() {
  // Release resources, stop timers, disconnect, etc.
  console.log("Destroy excel_tool");
}

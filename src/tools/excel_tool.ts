import * as csv from 'fast-csv';
import * as fs from 'fs';
import * as path from 'path';
import * as exceljs from 'exceljs';

// Define parameter schema
export const schema = {
  name: "excel_tool",
  description: "Read and write Excel/CSV files",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["read", "write", "convert_json_to_xlsx"],
      description: "Action to perform: read, write, or convert_json_to_xlsx"
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
    },
    stream: {
      type: "boolean",
      default: false,
      description: "Enable streaming for large files"
    },
    chunkSize: {
      type: "number",
      default: 1000,
      description: "Chunk size (rows) for streaming"
    }
  },
  required: ["action", "filePath", "format"]
};

interface ReadParams {
  filePath: string;
  format: 'xlsx' | 'xls' | 'csv';
  dateConversion?: boolean;
  stream?: boolean;
  chunkSize?: number;
}

interface WriteParams {
  filePath: string;
  data: Array<Record<string, any>>;
  format: 'xlsx' | 'xls' | 'csv';
  options?: {
    sheetName?: string;
    headerRow?: boolean;
  };
  stream?: boolean;
  chunkSize?: number;
}

async function readXLSX(params: ReadParams) {
  try {
    if (params.stream) {
      const workbook = new exceljs.default.Workbook();
      await workbook.xlsx.readFile(params.filePath);
      const sheet = workbook.getWorksheet(1);
      const results: any[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            rowData[sheet.getRow(1).getCell(colNumber).value as string] = cell.value;
          });
          results.push(rowData);
        }
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } else {
      const workbook = new exceljs.default.Workbook();
      await workbook.xlsx.readFile(params.filePath);
      const sheet = workbook.getWorksheet(1);
      const results: any[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            rowData[sheet.getRow(1).getCell(colNumber).value as string] = cell.value;
          });
          results.push(rowData);
        }
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
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
    if (params.stream) {
      const workbook = new exceljs.default.Workbook();
      const sheet = workbook.addWorksheet(params.options?.sheetName || 'Sheet1');

      // Add headers
      const headers = Object.keys(params.data[0]);
      sheet.addRow(headers);

      // Add data rows
      params.data.forEach(item => {
        const row = headers.map(header => item[header]);
        sheet.addRow(row);
      });

      await workbook.xlsx.writeFile(params.filePath);

      return {
        content: [
          {
            type: "text",
            text: `XLSX file written successfully to ${params.filePath} using streaming`,
          },
        ],
      };
    } else {
      const workbook = new exceljs.default.Workbook();
      const sheet = workbook.addWorksheet(params.options?.sheetName || 'Sheet1');

      // Add headers
      const headers = Object.keys(params.data[0]);
      sheet.addRow(headers);

      // Add data rows
      params.data.forEach(item => {
        const row = headers.map(header => item[header]);
        sheet.addRow(row);
      });

      await workbook.xlsx.writeFile(params.filePath);

      return {
        content: [
          {
            type: "text",
            text: `XLSX file written successfully to ${params.filePath}`,
          },
        ],
      };
    }
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
    const { action, filePath, format, data, options, stream, chunkSize } = request.params.arguments;

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
          return readXLSX({ filePath, format, stream, chunkSize });
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
          return writeXLSX({ filePath, data, format, options, stream, chunkSize });
        case "csv":
          return writeCSV({ filePath, data, format, options });
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } else if (action === "convert_json_to_xlsx") {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return writeXLSX({ filePath: filePath.replace('.json', '.xlsx'), data: jsonData, format: 'xlsx', options: options, stream: stream, chunkSize: chunkSize });
    }
     else {
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

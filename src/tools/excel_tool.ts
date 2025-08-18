import * as csv from 'fast-csv';
import * as fs from 'fs';
import * as path from 'path';
import * as exceljs from 'exceljs';

// Define parameter schema
export const schema = {
  name: "excel_tool",
  description: "Read and write Excel (xlsx) and CSV files, and convert from JSON.",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["read", "write", "convert_json_to_xlsx"],
      description: "Action to perform: read, write, or convert_json_to_xlsx"
    },
    filePath: {
      type: "string",
      description: "Absolute path to the input file"
    },
    outputFilePath: {
      type: "string",
      description: "Absolute path to the output file (required for write and convert actions)"
    },
    format: {
      type: "string",
      enum: ["xlsx", "csv"],
      description: "File format: xlsx, csv"
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
  filePath: string;
  format: 'xlsx' | 'csv';
  dateConversion?: boolean;
}

interface WriteParams {
  filePath: string;
  data: Array<Record<string, any>>;
  format: 'xlsx' | 'csv';
  options?: {
    sheetName?: string;
    headerRow?: boolean;
  };
}

async function readXLSX(params: ReadParams) {
  try {
    const workbook = new exceljs.default.Workbook();
    await workbook.xlsx.readFile(params.filePath);
    const sheet = workbook.getWorksheet(1);
    const results: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const headerCell = sheet.getRow(1).getCell(colNumber).value;
          if (headerCell) {
            rowData[headerCell.toString()] = cell.value;
          }
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
    const workbook = new exceljs.default.Workbook();
    const sheet = workbook.addWorksheet(params.options?.sheetName || 'Sheet1');

    // Add headers
    if (params.data.length === 0) {
      throw new Error("Data to write cannot be empty.");
    }
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
        // Correctly reject the promise on error
        reject(error);
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
        // Correctly reject the promise on error
        reject(error);
      });
  });
}

// Implement tool logic
export default async function (request: any) {
  try {
    const { action, filePath, outputFilePath, format, data, options } = request.params.arguments;

    // Validate file path
    if (!path.isAbsolute(filePath)) {
      throw new Error("Input filePath must be absolute");
    }

    // Check if file exists for read action
    if (action === "read" && !fs.existsSync(filePath)) {
      throw new Error(`Error: File not found - ${filePath}`);
    }

    if ((action === "write" || action === "convert_json_to_xlsx") && !outputFilePath) {
      throw new Error("outputFilePath is required for write and convert actions");
    }

    if (outputFilePath && !path.isAbsolute(outputFilePath)) {
      throw new Error("outputFilePath must be absolute");
    }

    if (action === "read") {
      // Read file logic
      switch (format) {
        case "xlsx":
          return readXLSX({ filePath, format });
        case "csv":
          return await readCSV({ filePath, format });
        default:
          throw new Error(`Unsupported format for read: ${format}`);
      }
    } else if (action === "write") {
      // Write file logic
      if (!data) {
        throw new Error("Data is required for write action");
      }
      switch (format) {
        case "xlsx":
          return writeXLSX({ filePath: outputFilePath, data, format, options });
        case "csv":
          return await writeCSV({ filePath: outputFilePath, data, format, options });
        default:
          throw new Error(`Unsupported format for write: ${format}`);
      }
    } else if (action === "convert_json_to_xlsx") {
      if (format !== 'xlsx') {
        throw new Error("convert_json_to_xlsx action only supports xlsx format");
      }
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      if (!Array.isArray(jsonData)) {
        throw new Error("JSON content must be an array of objects.");
      }
      return writeXLSX({ filePath: outputFilePath, data: jsonData, format: 'xlsx', options: options });
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

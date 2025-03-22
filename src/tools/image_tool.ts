import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);

export const schema = {
  name: "image_tool",
  description: "Compresses images, supporting single files and batch processing of directories.",
  type: "object",
  properties: {
    sourcePath: {
      type: "string",
      description: "Absolute path to the source file or directory"
    },
    outputPath: {
      type: "string",
      description: "Absolute path to the output directory (defaults to source directory)"
    },
    quality: {
      type: "number",
      description: "Compression quality (1-100, defaults to 75)",
      minimum: 1,
      maximum: 100,
      default: 75
    },
    resize: {
      type: "object",
      description: "Resize options",
      properties: {
        width: {
          type: "number",
          description: "Width"
        },
        height: {
          type: "number",
          description: "Height"
        }
      }
    },
    format: {
      type: "string",
      enum: ["jpeg", "png", "webp", "avif", "tiff", "gif"],
      description: "Output format"
    },
    mode: {
      type: "string",
      enum: ["sync", "async"],
      description: "Execution mode (sync or async)",
      default: "sync"
    },
    recursive: {
      type: "boolean",
      description: "Process subdirectories recursively",
      default: false
    },
    backupDir: {
      type: "string",
      description: "Absolute path to the backup directory (if not specified, no backup)"
    }
  },
  required: ["sourcePath"]
};

async function processImage(inputPath: string, outputPath: string, options: any) {
  let tempFilePath: string | null = null;
  try {
    const { quality, resize, format, backupDir } = options;

    if (backupDir) {
      const backupPath = path.join(backupDir, path.basename(inputPath));
      await mkdir(backupDir, { recursive: true });
      fs.copyFileSync(inputPath, backupPath);
    }

    let sharpImage = sharp(inputPath);

    if (resize) {
      sharpImage = sharpImage.resize(resize.width, resize.height);
    }

    if (format === 'jpeg') {
      sharpImage = sharpImage.jpeg({ quality: quality || 75 });
    } else if (format === 'png') {
      sharpImage = sharpImage.png({ quality: quality || 75 });
    } else if (format === 'webp') {
      sharpImage = sharpImage.webp({ quality: quality || 75 });
    } else if (format === 'avif') {
      sharpImage = sharpImage.avif({ quality: quality || 75 });
    } else if (format === 'tiff') {
      sharpImage = sharpImage.tiff({ quality: quality || 75 });
    } else if (format === 'gif') {
      sharpImage = sharpImage.gif();
    }

    if (inputPath === outputPath) {
      tempFilePath = path.join(path.dirname(inputPath), `temp_${path.basename(inputPath)}`);
      await sharpImage.toFile(tempFilePath);
      fs.renameSync(tempFilePath, inputPath);
    } else {
      await sharpImage.toFile(outputPath);
    }

    return { success: true, input: inputPath, output: outputPath };
  } catch (error) {
    console.error(`Error processing image ${inputPath}:`, error);
    if (tempFilePath) {
      fs.unlinkSync(tempFilePath);
    }
    return { success: false, input: inputPath, error: error.message };
  }
}

async function processDirectory(sourcePath: string, outputPath: string, options: any) {
  try {
    const { recursive, backupDir } = options;
    await mkdir(outputPath, { recursive: true });
    const files = await readdir(sourcePath);

    const results = [];
    for (const file of files) {
      const filePath = path.join(sourcePath, file);
      const fileStat = await stat(filePath);

      if (fileStat.isFile() && /\.(jpg|jpeg|png|webp|avif|tiff|gif)$/i.test(file)) {
        const outputFileName = path.basename(file);
        const outputFilePath = path.join(outputPath, outputFileName);

        if (backupDir) {
          const backupPath = path.join(backupDir, file);
          await mkdir(path.dirname(backupPath), { recursive: true });
          fs.copyFileSync(filePath, backupPath);
        }
        const result = await processImage(filePath, outputFilePath, options);
        results.push(result);
      } else if (fileStat.isDirectory() && recursive) {
        const subDirectoryName = path.basename(file);
        const subDirectoryOutputPath = path.join(outputPath, subDirectoryName);
        const subDirectoryResults = await processDirectory(filePath, subDirectoryOutputPath, options);
        results.push(...subDirectoryResults);
      }
    }
    return results;
  } catch (error) {
    console.error(`Error processing directory ${sourcePath}:`, error);
    return [{ success: false, input: sourcePath, error: error.message }];
  }
}

export default async function (request: any) {
  try {
    const { sourcePath, outputPath: userOutputPath, quality, resize, format, mode, recursive, backupDir } = request.params.arguments;

    const sourcePathStat = await stat(sourcePath);

    let outputPath = userOutputPath;
    if (!outputPath) {
      outputPath = sourcePathStat.isFile() ?
        sourcePath :
        path.join(path.dirname(sourcePath), path.basename(sourcePath));
    }

    const options = { quality, resize, format, recursive, backupDir };

    let results;
    if (sourcePathStat.isFile()) {
      results = [await processImage(sourcePath, outputPath, options)];
    } else if (sourcePathStat.isDirectory()) {
      results = await processDirectory(sourcePath, outputPath, options);
    } else {
      throw new Error("Source path must be a file or directory");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function destroy() {
  console.log("Destroy image_tool");
}

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);

export const schema = {
  name: "image_tool",
  description: "A powerful image processing tool that supports format conversion, resizing, quality compression, and can batch process directories.",
  type: "object",
  properties: {
    sourcePath: {
      type: "string",
      description: "Source file or directory path"
    },
    outputPath: {
      type: "string",
      description: "Output directory path. Defaults to a new file (e.g., 'source.processed.jpg') or a new directory (e.g., 'source_processed')."
    },
    quality: {
      type: "number",
      description: "Compression quality for JPEG/WebP/AVIF/TIFF (1-100, defaults to 80)",
      minimum: 1,
      maximum: 100,
      default: 80
    },
    compressionLevel: {
        type: "number",
        description: "PNG compression level (0-9, defaults to 6)",
        minimum: 0,
        maximum: 9,
        default: 6
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
      description: "Output format (optional, keeps original if not specified)"
    },
    recursive: {
      type: "boolean",
      description: "Process subdirectories recursively",
      default: false
    },
    backupDir: {
      type: "string",
      description: "Backup directory path (optional)"
    }
  },
  required: ["sourcePath"]
};

async function processImage(inputPath: string, outputPath: string, options: any) {
  let tempFilePath: string | null = null;
  try {
    const { quality, compressionLevel, resize, format, backupDir } = options;

    if (backupDir) {
      const backupPath = path.join(backupDir, path.basename(inputPath));
      await mkdir(backupDir, { recursive: true });
      fs.copyFileSync(inputPath, backupPath);
    }

    let sharpImage = sharp(inputPath);

    if (resize) {
      sharpImage = sharpImage.resize(resize.width, resize.height);
    }
    
    const targetFormat = format || path.extname(inputPath).substring(1);

    switch (targetFormat) {
        case 'jpeg':
            sharpImage = sharpImage.jpeg({ quality: quality || 80 });
            break;
        case 'png':
            sharpImage = sharpImage.png({ compressionLevel: compressionLevel || 6 });
            break;
        case 'webp':
            sharpImage = sharpImage.webp({ quality: quality || 80 });
            break;
        case 'avif':
            sharpImage = sharpImage.avif({ quality: quality || 80 });
            break;
        case 'tiff':
            sharpImage = sharpImage.tiff({ quality: quality || 80 });
            break;
        case 'gif':
            sharpImage = sharpImage.gif();
            break;
    }

    // Ensure output directory exists
    await mkdir(path.dirname(outputPath), { recursive: true });

    if (inputPath === outputPath) {
      // This case should be avoided by the new default path logic, but kept for safety
      tempFilePath = path.join(path.dirname(inputPath), `temp_${path.basename(inputPath)}`);
      await sharpImage.toFile(tempFilePath);
      fs.renameSync(tempFilePath, inputPath);
    } else {
      await sharpImage.toFile(outputPath);
    }

    return { success: true, input: inputPath, output: outputPath };
  } catch (error) {
    console.error(`Error processing image ${inputPath}:`, error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, input: inputPath, error: errorMessage };
  }
}

async function processDirectory(sourcePath: string, outputPath: string, options: any) {
  try {
    const { recursive, backupDir, format } = options;
    await mkdir(outputPath, { recursive: true });
    const files = await readdir(sourcePath);

    const results = [];
    for (const file of files) {
      const filePath = path.join(sourcePath, file);
      const fileStat = await stat(filePath);

      if (fileStat.isFile() && /\.(jpg|jpeg|png|webp|avif|tiff|gif)$/i.test(file)) {
        const parsedPath = path.parse(file);
        const outputFileName = format ? `${parsedPath.name}.${format}` : file;
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [{ success: false, input: sourcePath, error: errorMessage }];
  }
}

export default async function (request: any) {
  try {
    const { sourcePath, outputPath: userOutputPath, quality, compressionLevel, resize, format, recursive, backupDir } = request.params.arguments;

    const sourcePathStat = await stat(sourcePath);

    let outputPath;
    if (userOutputPath) {
        outputPath = userOutputPath;
    } else {
        if (sourcePathStat.isFile()) {
            const parsedPath = path.parse(sourcePath);
            const outputFormat = format || parsedPath.ext.slice(1);
            outputPath = path.join(parsedPath.dir, `${parsedPath.name}.processed.${outputFormat}`);
        } else { // is directory
            outputPath = `${sourcePath}_processed`;
        }
    }

    const options = { quality, compressionLevel, resize, format, recursive, backupDir };

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

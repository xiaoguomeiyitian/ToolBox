import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import extract from 'extract-zip';
import * as tar from 'tar';
import fse from 'fs-extra';

export const schema = {
    name: "compress_tool",
    description: "Compress/extract files (zip, tar, tar.gz)",
    type: "object",
    properties: {
        action: {
            type: "string",
            description: "Action type: compress or extract",
            enum: ["compress", "extract"],
        },
        sourcePath: {
            type: "string",
            description: "Absolute path to source file/directory",
        },
        destinationPath: {
            type: "string",
            description: "Absolute path to destination file/directory",
        },
        format: {
            type: "string",
            description: "Compression format: zip, tar, tar.gz",
            enum: ["zip", "tar", "tar.gz"],
        },
    },
    required: ["action", "sourcePath", "destinationPath", "format"]
};

async function compressZip(source: string, dest: string) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(dest);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(undefined));
        archive.on('error', (err) => reject(err));

        const stats = fs.statSync(source);
        if (stats.isDirectory()) {
            archive.directory(source, false);
        } else {
            archive.file(source, { name: path.basename(source) });
        }

        archive.pipe(output);
        archive.finalize();
    });
}

async function compressTar(source: string, dest: string, gzip: boolean) {
    const stats = fs.statSync(source);
    let cwd, files;
    if (stats.isDirectory()) {
        cwd = source;
        files = ['.'];
    } else {
        cwd = path.dirname(source);
        files = [path.basename(source)];
    }
    await tar.c({
        gzip,
        file: dest,
        cwd,
    }, files);
}

async function extractZip(source: string, dest: string) {
    await extract(source, { dir: dest });
}

async function extractTar(source: string, dest: string, gzip: boolean) {
    await fse.ensureDir(dest);

    try {
        await tar.x({
            file: source,
            cwd: dest,
            gzip: gzip
        });
    } catch (error) {
        throw error;
    }
}

export default async (request: any) => {
    try {
        const { action, sourcePath, destinationPath, format } = request.params.arguments;

        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source path does not exist: ${sourcePath}`);
        }

        const destDir = path.dirname(destinationPath);
        if (!fs.existsSync(destDir)) {
            // For extraction, we can create the directory. For compression, it must exist.
            if (action === 'compress') {
                throw new Error(`Destination directory does not exist: ${destDir}`);
            }
        }

        if (action === 'compress') {
            if (format === 'zip') {
                await compressZip(sourcePath, destinationPath);
            } else if (format === 'tar') {
                await compressTar(sourcePath, destinationPath, false);
            } else if (format === 'tar.gz') {
                await compressTar(sourcePath, destinationPath, true);
            }
        } else if (action === 'extract') {
            await fse.ensureDir(destinationPath); // Ensure destination directory exists for extraction
            if (format === 'zip') {
                await extractZip(sourcePath, destinationPath);
            } else if (format === 'tar' || format === 'tar.gz') {
                await extractTar(sourcePath, destinationPath, format === 'tar.gz');
            }
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    status: "success",
                    operation: `${action} completed`,
                    source: sourcePath,
                    destination: destinationPath
                }, null, 2)
            }]
        };

    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    error: error.message,
                    stack: error.stack
                }, null, 2)
            }],
            isError: true
        };
    }
};

// Destroy function
export async function destroy() {
    // Release resources, stop timers, disconnect, etc.
    console.log("Destroy compress_tool");
}

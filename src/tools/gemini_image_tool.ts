import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Define parameter schema
export const schema = {
  name: "gemini_image_tool",
  description: "Generate or edit images with Gemini",
  type: "object",
  properties: {
    operation: {
      type: "string",
      enum: ["generate_image", "edit_image"],
      description: "generate_image: Generate new image, edit_image: Edit existing image",
    },
    prompt: {
      type: "string",
      description: "Prompt for image generation/editing",
    },
    inputImage: {
      type: "string",
      description: "Image path (required for edit_image)",
    },
    outputDir: {
      type: "string",
      description: "Output directory path",
    },
    fileName: {
      type: "string",
      default: "image-${year}_${month}_${day}_${hour}_${minute}_${second}.png",
      description: "Output file name template",
    },
    temperature: {
      type: "number",
      description: "Temperature of the model",
      minimum: 0,
      maximum: 1,
      default: 1
    },
    topP: {
      type: "number",
      description: "Top P of the model",
      minimum: 0,
      maximum: 1,
      default: 0.95
    },
    topK: {
      type: "number",
      description: "Top K of the model",
      default: 40
    },
    maxOutputTokens: {
      type: "number",
      description: "Maximum number of output tokens",
      default: 8192
    }
  },
  required: ["operation", "prompt", "outputDir"],
};

// Implement tool logic
export default async function (request: any) {
  try {
    const { operation, prompt, inputImage, outputDir, fileName = "image-${year}_${month}_${day}_${hour}_${minute}_${second}.png", temperature = 1, topP = 0.95, topK = 40, maxOutputTokens = 8192 } = request.params.arguments;

    // API Key validation
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY 环境变量未设置");
    }

    // Path validation
    if (!path.isAbsolute(outputDir)) {
      throw new Error(`路径必须是绝对路径（示例：${path.join(path.parse(process.cwd()).root, "my_images")}）`);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Output directory creation
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      throw new Error(`无法创建目录 ${outputDir}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Filename processing
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const finalFileName = fileName
      .replace("${year}", year.toString())
      .replace("${month}", month)
      .replace("${day}", day)
      .replace("${hour}", hour)
      .replace("${minute}", minute)
      .replace("${second}", second);
    const imagePath = path.join(outputDir, finalFileName);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        // @ts-ignore
        responseModalities: ['Text', 'Image'],
        temperature: temperature,
        topP: topP,
        topK: topK,
        maxOutputTokens: maxOutputTokens
      },
    });

    let contents;

    if (operation === "generate_image") {
      contents = prompt;
    } else if (operation === "edit_image") {
      if (!inputImage) {
        throw new Error("编辑图片操作需要提供 inputImage 参数");
      }

      const imageBuffer = fs.readFileSync(inputImage);
      const base64Image = imageBuffer.toString("base64");

      contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ];
    } else {
      throw new Error("不支持的操作类型: " + operation);
    }

    const response = await model.generateContent(contents);

    for (const part of response.response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync(imagePath, buffer);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: "Image saved to " + imagePath,
        },
      ],
    };
  } catch (error: any) {
    console.error("Error generating content:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

// Destroy function
export async function destroy() {
  // Release resources, stop timers, disconnect, etc.
  console.log("Destroy gemini_image_tool");
}

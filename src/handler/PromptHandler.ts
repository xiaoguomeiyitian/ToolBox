import { notes } from "../tools/create_note.js";

/** 所有提示词列表 */
export const listPromptsHandler = async () => {
    return {
        prompts: [
            {
                name: "summarize_notes",
                description: "Summarize all notes",
            }
        ]
    };
};
/** 获取某个提示词*/
export const getPromptHandler = async (request: any) => {
    if (PromptHandler[request.params.name]) return PromptHandler[request.params.name](request);
    throw new Error("Unknown prompt");
};
export class PromptHandler {
    /** 总结笔记 */
    static async summarize_notes() {
        const embeddedNotes = Object.entries(notes).map(([id, note]) => ({
            type: "resource" as const,
            resource: {
                uri: `note:///${id}`,
                mimeType: "text/plain",
                text: note.content
            }
        }));

        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: "Please summarize the following notes:"
                    }
                },
                ...embeddedNotes.map(note => ({
                    role: "user" as const,
                    content: note
                })),
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: "Provide a concise summary of all the notes above."
                    }
                }
            ]
        };
    }
}
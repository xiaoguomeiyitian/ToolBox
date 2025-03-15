
type Note = { title: string; content: string };
export const notes: { [id: string]: Note } = {};

/** create_note 工具的参数列表 */
export const schema = {
    name: "create_note",
    description: "Create a new note",
    type: "object",
    properties: {
        title: {
            type: "string",
            description: "Title of the note",
        },
        content: {
            type: "string",
            description: "Text content of the note",
        },
    },
    required: ["title", "content"],
    outputSchema: {
        type: "object",
        properties: {
            content: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            description: "The content type (e.g., 'text')."
                        },
                        text: {
                            type: "string",
                            description: "The query result in JSON string format."
                        }
                    },
                    required: ["type", "text"]
                },
                description: "An array containing the query result."
            },
            isError: {
                type: "boolean",
                description: "Indicates whether an error occurred during the query.",
                default: false
            }
        },
        required: ["content"]
    }
};

export default async (request: any) => {
    try {
        const title = String(request.params.arguments?.title);
        const content = String(request.params.arguments?.content);

        if (!title || !content) {
            throw new Error("Title and content are required");
        }

        if (title.length > 100) {
            throw new Error("Title must be less than 100 characters");
        }

        if (content.length > 1000) {
            throw new Error("Content must be less than 1000 characters");
        }

        const id = String(Object.keys(notes).length + 1);
        notes[id] = { title, content };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(`Created note ${id}: ${title}`),
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error creating note: ${error.message}`,
                },
            ],
            isError: true
        };
    }
};

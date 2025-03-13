
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
};

export default async (request: any) => {
    const title = String(request.params.arguments?.title);
    const content = String(request.params.arguments?.content);
    if (!title || !content) {
        throw new Error("Title and content are required");
    }
    const id = String(Object.keys(notes).length + 1);
    notes[id] = { title, content };
    return {
        content: [
            {
                type: "text",
                text: `Created note ${id}: ${title}`,
            },
        ],
    };
};
import { notes } from "./tool/create_note.js";

/** 所有资源列表 */
export const listResourcesHandler = async () => {
    return {
        resources: Object.entries(notes).map(([id, note]) => ({
            uri: `note:///${id}`,
            mimeType: "text/plain",
            name: note.title,
            description: `A text note: ${note.title}`
        }))
    };
};
/** 读取某个资源 */
export const readResourceHandler = async (request: any) => {
    const url = new URL(request.params.uri);
    const id = url.pathname.replace(/^\//, "");
    const note = notes[id];

    if (!note) {
        throw new Error(`Note ${id} not found`);
    }

    return {
        contents: [
            {
                uri: request.params.uri,
                mimeType: "text/plain",
                text: note.content,
            },
        ],
    };
};
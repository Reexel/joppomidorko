export interface Note {
    id: string;
    title: string;
    body: string;
    parent_id: string;
    [key: string]: any;
}

export class JoplinWorkspace {
    async selectedNote(): Promise<Note | null> { return null; }
    async selectedNoteIds(): Promise<string[]> { return []; }
    async selectedFolder(): Promise<any> { return null; }
    async onNoteSelectionChange(callback: () => void): Promise<void> {}
    async onNoteChange(callback: () => void): Promise<void> {}
}

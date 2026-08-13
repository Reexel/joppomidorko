export type ViewHandle = string;

export class JoplinViewsPanels {
    async create(id: string): Promise<ViewHandle> { return ''; }
    async setHtml(handle: ViewHandle, html: string): Promise<string> { return ''; }
    async addScript(handle: ViewHandle, scriptPath: string): Promise<void> {}
    async show(handle: ViewHandle, show?: boolean): Promise<void> {}
    async hide(handle: ViewHandle): Promise<void> {}
    async visible(handle: ViewHandle): Promise<boolean> { return false; }
    async onMessage(handle: ViewHandle, callback: (message: any) => any): Promise<void> {}
    async postMessage(handle: ViewHandle, message: any): Promise<void> {}
}

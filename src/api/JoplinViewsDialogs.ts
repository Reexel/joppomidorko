export type ViewHandle = string;

export interface DialogResult {
    id: string;
    formData?: Record<string, any>;
}

export interface ButtonSpec {
    id: string;
    title: string;
}

export class JoplinViewsDialogs {
    async create(id: string): Promise<ViewHandle> { return ''; }
    async setHtml(handle: ViewHandle, html: string): Promise<string> { return ''; }
    async setButtons(handle: ViewHandle, buttons: ButtonSpec[]): Promise<void> {}
    async open(handle: ViewHandle): Promise<DialogResult> { return { id: '' }; }
    async showMessageBox(message: string, buttons?: string[]): Promise<number> { return 0; }
}

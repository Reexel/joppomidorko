export class JoplinSettings {
    async value(key: string): Promise<any> { return null; }
    async setValue(key: string, value: any): Promise<void> {}
    async registerSettings(settings: Record<string, any>): Promise<void> {}
    async globalValue(key: string): Promise<any> { return null; }
    async globalSetValue(key: string, value: any): Promise<void> {}
}

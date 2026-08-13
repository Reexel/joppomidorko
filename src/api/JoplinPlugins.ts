export class JoplinPlugins {
    async register(plugin: { onStart: () => Promise<void> }): Promise<void> {}
}

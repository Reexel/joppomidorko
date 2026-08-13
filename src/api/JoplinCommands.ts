export interface Command {
    name: string;
    label: string;
    execute: (...args: any[]) => Promise<any>;
}

export class JoplinCommands {
    async register(command: Command): Promise<void> {}
    async execute(commandName: string, ...args: any[]): Promise<any> {}
}

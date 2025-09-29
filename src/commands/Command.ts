export interface Command {
    readonly id: string;

    execute(...args: any[]): Promise<void>;
}
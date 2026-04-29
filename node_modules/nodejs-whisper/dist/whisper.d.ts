export interface IShellOptions {
    silent: boolean;
    async: boolean;
}
export declare function whisperShell(command: string, options?: IShellOptions, logger?: Console): Promise<string>;
export declare function executeCppCommand(command: string, logger: Console, withCuda: boolean): Promise<string>;

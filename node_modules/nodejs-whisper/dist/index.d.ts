import { WhisperOptions } from './types';
export interface IOptions {
    modelName: string;
    autoDownloadModelName?: string;
    whisperOptions?: WhisperOptions;
    withCuda?: boolean;
    removeWavFileAfterTranscription?: boolean;
    logger?: Console;
}
export declare function nodewhisper(filePath: string, options: IOptions): Promise<string>;

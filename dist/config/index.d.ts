export interface ServerConfig {
    outputCacheDir: string;
    maxFileSizeBytes: number;
    allowedExtensions: Set<string>;
    colorTempD65Kelvin: number;
}
export declare const config: ServerConfig;
export declare function ensureOutputDirectory(): string;

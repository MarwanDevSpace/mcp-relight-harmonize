import { ResultEnvelope } from "../core/envelope";
export interface CachedItem {
    filename: string;
    path: string;
    sizeBytes: number;
    createdAt: string;
    type: "relight_variation" | "harmonized_composite" | "other";
}
export declare function listCachedVariationsTool(cacheDir?: string): ResultEnvelope;

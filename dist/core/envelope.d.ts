export type EnvelopeStatus = "success" | "partial" | "blocked" | "failed";
export interface EvidenceSource {
    label: string;
    uri?: string;
    retrievedAt?: string;
}
export interface EvidenceArtifact {
    label: string;
    uri?: string;
    sha256?: string;
}
export interface Evidence {
    inputsDigest?: string;
    sources?: EvidenceSource[];
    artifacts?: EvidenceArtifact[];
}
export interface ResultEnvelope<T = any> {
    status: EnvelopeStatus;
    summary: string;
    data: T;
    warnings: string[];
    evidence: Evidence;
    nextActions: string[];
}
export declare function createEnvelope<T>(status: EnvelopeStatus, summary: string, data: T, options?: {
    warnings?: string[];
    evidence?: Evidence;
    nextActions?: string[];
}): ResultEnvelope<T>;

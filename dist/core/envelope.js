"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnvelope = createEnvelope;
function createEnvelope(status, summary, data, options) {
    return {
        status,
        summary,
        data,
        warnings: options?.warnings || [],
        evidence: {
            inputsDigest: options?.evidence?.inputsDigest,
            sources: options?.evidence?.sources || [],
            artifacts: options?.evidence?.artifacts || [],
        },
        nextActions: options?.nextActions || [],
    };
}

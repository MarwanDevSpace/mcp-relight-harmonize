export interface LayerItem {
    file: string;
    path: string;
    description: string;
    metricLabel: string;
    metricValue: string | number;
}
export interface DynamicDiagnostics {
    thermalDescription: string;
    opticalPhysics: {
        cctKelvin: number;
        azimuthDeg: number;
        elevationDeg: number;
        hlCoveragePct: number;
        shadowCoveragePct: number;
        aoCoveragePct: number;
        edgeRoughness: number;
        saturationMean: number;
    };
    detailedJsonSpecification: Record<string, any>;
    masterDescriptivePrompt: string;
    findings: string[];
    tailoredOptions: string[];
    universalImagePrompt: string;
    nanoBananaPrompt: string;
}
export interface LayerExtractionReport {
    sourceImage: string;
    layersDirectory: string;
    dimensions: [number, number];
    opticalMetrics: {
        cctKelvin: number;
        dominantLightVector: [number, number, number];
        lightingAngles: {
            azimuthDeg: number;
            elevationDeg: number;
        };
        meanLuminance: number;
        meanSaturation: number;
        edgeRoughness: number;
    };
    diagnostics: DynamicDiagnostics;
    layers: {
        highlights: LayerItem;
        shadows: LayerItem;
        ambientOcclusion: LayerItem;
        edges: LayerItem;
        depthNormals: LayerItem;
        chromaSaturation: LayerItem;
    };
    layerMarkdownPath: string;
}
export declare function buildDynamicDiagnostics(cctKelvin: number, azimuthDeg: number, elevationDeg: number, hlPct: number, shPct: number, aoPct: number, meanGradient: number, meanSaturation: number, userIntent?: string): DynamicDiagnostics;
export declare function extractLayersImpl(imagePath: string, outputDir?: string, userIntent?: string): LayerExtractionReport;

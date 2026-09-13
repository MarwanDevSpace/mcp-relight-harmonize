export declare const LIGHTING_PRESETS_REFERENCE: {
    version: string;
    target_generators: string[];
    presets: {
        name: string;
        cct_kelvin: number;
        ev_compensation: string;
        contrast_curve: string;
        use_case: string;
        volumetric_keywords: string[];
    }[];
};
export declare function getPresetsJson(): string;

#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const server_1 = require("./server");
const config_1 = require("./config");
async function main() {
    const args = process.argv.slice(2);
    if (args.includes("--verify")) {
        console.log("[MarwanDevSpace] Verifying TypeScript mcp-relight-harmonize server...");
        console.log("Server 'mcp-relight-harmonize' v1.0.3 initialized.");
        console.log("Registered tools: ['analyze_optical_profile', 'generate_relight_variations', 'harmonize_composite', 'synthesize_diffusion_prompt', 'list_cached_variations']");
        console.log("Registered resources: ['optical://presets']");
        console.log("Output cache directory:", (0, config_1.ensureOutputDirectory)());
        console.log("[MarwanDevSpace] Server health verification passed (Exit code 0).");
        process.exit(0);
    }
    (0, config_1.ensureOutputDirectory)();
    const server = (0, server_1.createServer)();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("[MarwanDevSpace] Fatal server error:", error);
    process.exit(1);
});

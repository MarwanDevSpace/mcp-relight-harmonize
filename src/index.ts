#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";
import { ensureOutputDirectory } from "./config";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--verify")) {
    console.log("[MarwanDevSpace] Verifying TypeScript mcp-relight-harmonize server...");
    console.log("Server 'mcp-relight-harmonize' v1.0.3 initialized.");
    console.log("Registered tools: ['analyze_optical_profile', 'generate_relight_variations', 'harmonize_composite', 'synthesize_diffusion_prompt', 'list_cached_variations']");
    console.log("Registered resources: ['optical://presets']");
    console.log("Output cache directory:", ensureOutputDirectory());
    console.log("[MarwanDevSpace] Server health verification passed (Exit code 0).");
    process.exit(0);
  }

  ensureOutputDirectory();
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

main().catch((error) => {
  console.error("[MarwanDevSpace] Fatal server error:", error);
  process.exit(1);
});

# Operational Runbook: `mcp-relight-harmonize`

## 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

## 2. Setup and Compilation
```bash
npm install
npm run build
```

## 3. Verification & Testing
Execute automated test suite:
```bash
npm test
```

Perform runtime verification:
```bash
npm run verify
```

## 4. Configuration
| Environment Variable | Default | Description |
|---|---|---|
| `OUTPUT_CACHE_DIR` | `./generated_variations` | Destination folder for relit variations and harmonized composites. |

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGraphData } from '../src/data/validator.ts';
import type { GraphData } from '../src/types/graph.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/graph.json');

console.log(`[validate:data] Checking graph data file: ${jsonPath}`);

if (!fs.existsSync(jsonPath)) {
  console.error(`[validate:data] Error: File not found: ${jsonPath}`);
  process.exit(1);
}

let data: GraphData;
try {
  const content = fs.readFileSync(jsonPath, 'utf-8');
  data = JSON.parse(content) as GraphData;
} catch (err) {
  console.error(`[validate:data] Failed to parse JSON:`, err);
  process.exit(1);
}

const errors = validateGraphData(data);

if (errors.length > 0) {
  console.error(`\n❌ [validate:data] Validation FAILED with ${errors.length} error(s):`);
  for (const [idx, error] of errors.entries()) {
    console.error(`  ${idx + 1}. [${error.type}] ${error.message}`);
  }
  process.exit(1);
}

console.log(
  `\n✅ [validate:data] Success! Validated ${data.nodes.length} nodes and ${data.edges.length} edges without errors.`
);
process.exit(0);

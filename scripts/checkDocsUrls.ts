import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GraphData } from '../src/types/graph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/graph.json');

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Try HEAD first
    let res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'RoleNetwork-DocsChecker/1.0' },
    });

    // If server rejects HEAD (e.g., 405 Method Not Allowed), retry with GET
    if (res.status === 405) {
      res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'RoleNetwork-DocsChecker/1.0' },
      });
    }

    clearTimeout(timeout);
    return { ok: res.ok || res.status < 400, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function runCheck() {
  console.log('[checkDocsUrls] Checking live response for all docsUrl entries...');
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(content) as GraphData;

  const urlNodes = data.nodes.filter((n) => n.docsUrl);
  console.log(`[checkDocsUrls] Found ${urlNodes.length} nodes with docsUrl to test.\n`);

  let failures = 0;

  for (const node of urlNodes) {
    const url = node.docsUrl!;
    process.stdout.write(`Testing [${node.id}] ${url}... `);
    const result = await checkUrl(url);

    if (result.ok) {
      console.log(`✅ ${result.status ?? 200}`);
    } else {
      console.log(`⚠️ FAILED (${result.status ?? result.error})`);
      failures++;
    }
  }

  console.log(`\n[checkDocsUrls] Completed. Total tested: ${urlNodes.length}, Warnings: ${failures}.`);
  // Do not fail exit code so scheduled jobs provide actionable report without blocking builds
  process.exit(0);
}

runCheck();

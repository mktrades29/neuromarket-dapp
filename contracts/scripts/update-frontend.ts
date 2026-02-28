// ═══════════════════════════════════════════════════════════════════════════════
//  update-frontend.ts — Reads deployment.json and patches the frontend config
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Usage: npx tsx scripts/update-frontend.ts
//
//  After deploying, this script reads build/deployment.json and automatically
//  updates frontend/src/utils/contract.ts with the real contract address.
//
// ═══════════════════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEPLOYMENT_PATH = path.resolve(__dirname, '../build/deployment.json');
const CONTRACT_FILE = path.resolve(__dirname, '../../frontend/src/utils/contract.ts');

function main(): void {
  // ── Read deployment info ──
  if (!fs.existsSync(DEPLOYMENT_PATH)) {
    console.error('[ERROR] build/deployment.json not found. Deploy the contract first.');
    process.exit(1);
  }

  const deployInfo = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, 'utf-8'));
  const contractAddress = deployInfo.contractAddress;

  if (!contractAddress) {
    console.error('[ERROR] No contractAddress in deployment.json');
    process.exit(1);
  }

  // ── Patch the frontend contract.ts ──
  if (!fs.existsSync(CONTRACT_FILE)) {
    console.error('[ERROR] Frontend contract.ts not found at:', CONTRACT_FILE);
    process.exit(1);
  }

  let source = fs.readFileSync(CONTRACT_FILE, 'utf-8');

  // Replace the placeholder address
  const addressPattern = /export const NEUROMARKET_ADDRESS = ['"].*?['"]/;
  const newLine = `export const NEUROMARKET_ADDRESS = '${contractAddress}'`;

  if (!addressPattern.test(source)) {
    console.error('[ERROR] Could not find NEUROMARKET_ADDRESS in contract.ts');
    process.exit(1);
  }

  source = source.replace(addressPattern, newLine);
  fs.writeFileSync(CONTRACT_FILE, source, 'utf-8');

  console.log('\n  Frontend updated successfully!');
  console.log(`  NEUROMARKET_ADDRESS = '${contractAddress}'`);
  console.log(`  File: ${CONTRACT_FILE}\n`);
}

main();

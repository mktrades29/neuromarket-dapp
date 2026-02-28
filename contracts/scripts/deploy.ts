// ═══════════════════════════════════════════════════════════════════════════════
//  deploy.ts — Deploy NeuroMarket contract to OP_NET (regtest / testnet)
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Usage:
//    1. Copy .env.example → .env and set your DEPLOYER_WIF
//    2. Get regtest BTC from https://faucet.opnet.org
//    3. Run: npm run deploy:regtest
//
//  What this script does:
//    1. Reads the compiled NeuroMarket.wasm bytecode
//    2. Connects to the OP_NET RPC provider
//    3. Fetches UTXOs + current epoch challenge
//    4. Builds a two-TX deployment (funding + Taproot reveal)
//    5. Broadcasts both transactions
//    6. Outputs the deterministic contract address
//
// ═══════════════════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// ── Resolve __dirname for ESM ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════════
//  Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  deployerWif: process.env.DEPLOYER_WIF || '',
  rpcUrl: process.env.OPNET_RPC_URL || 'https://regtest.opnet.org',
  network: process.env.OPNET_NETWORK || 'regtest',
  feeRate: parseInt(process.env.FEE_RATE || '10', 10),
  priorityFee: BigInt(process.env.PRIORITY_FEE || '1000'),
  gasSatFee: BigInt(process.env.GAS_SAT_FEE || '500'),
  wasmPath: path.resolve(__dirname, '../build/NeuroMarket.wasm'),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Validation
// ═══════════════════════════════════════════════════════════════════════════════

function validateConfig(): void {
  if (!CONFIG.deployerWif || CONFIG.deployerWif === 'cYourRegtestPrivateKeyInWIFFormatHere') {
    console.error('\n[ERROR] DEPLOYER_WIF not set.');
    console.error('  1. Copy .env.example → .env');
    console.error('  2. Set your regtest WIF private key');
    console.error('  3. Get regtest BTC from https://faucet.opnet.org\n');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.wasmPath)) {
    console.error('\n[ERROR] NeuroMarket.wasm not found at:', CONFIG.wasmPath);
    console.error('  Run "npm run build" first to compile the contract.\n');
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main Deployment
// ═══════════════════════════════════════════════════════════════════════════════

async function deploy(): Promise<void> {
  validateConfig();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║        NeuroMarket — Contract Deployment                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Step 1: Import SDK modules ──
  // Dynamic imports so validation errors are caught first
  console.log('[1/6] Loading SDK modules...');

  const { TransactionFactory, EcKeyPair } = await import('@btc-vision/transaction');
  const { JSONRpcProvider } = await import('opnet');
  const { networks } = await import('@btc-vision/bitcoin');

  // ── Step 2: Setup network + provider ──
  console.log(`[2/6] Connecting to OP_NET ${CONFIG.network}...`);

  const network = CONFIG.network === 'testnet' ? networks.testnet : networks.regtest;
  const provider = new JSONRpcProvider(CONFIG.rpcUrl, network);

  console.log(`       RPC: ${CONFIG.rpcUrl}`);

  // ── Step 3: Setup signer from WIF ──
  console.log('[3/6] Initializing deployer wallet...');

  const signer = EcKeyPair.fromWIF(CONFIG.deployerWif, network);
  const deployerAddress = EcKeyPair.getTaprootAddress(signer, network);

  console.log(`       Deployer: ${deployerAddress}`);

  // ── Step 4: Read .wasm bytecode ──
  console.log('[4/6] Reading contract bytecode...');

  const bytecode = fs.readFileSync(CONFIG.wasmPath);
  const bytecodeSizeKB = (bytecode.length / 1024).toFixed(2);

  console.log(`       File: ${CONFIG.wasmPath}`);
  console.log(`       Size: ${bytecodeSizeKB} KB (${bytecode.length} bytes)`);

  // ── Step 5: Fetch UTXOs + challenge ──
  console.log('[5/6] Fetching UTXOs and epoch challenge...');

  const utxos = await provider.utxoManager.getUTXOsForAmount({
    address: deployerAddress,
    amount: 100000n, // 100k sats should cover deployment fees
  });

  console.log(`       UTXOs found: ${utxos.length}`);

  if (utxos.length === 0) {
    console.error('\n[ERROR] No UTXOs found for deployer address.');
    console.error(`  Send regtest BTC to: ${deployerAddress}`);
    console.error('  Faucet: https://faucet.opnet.org\n');
    process.exit(1);
  }

  const challenge = await provider.getChallenge();
  console.log('       Epoch challenge fetched.');

  // ── Step 6: Build, sign & broadcast ──
  console.log('[6/6] Building deployment transaction...\n');

  const factory = new TransactionFactory();

  const deployResult = await factory.signDeployment({
    signer,
    mldsaSigner: null,
    network,
    utxos,
    from: deployerAddress,
    feeRate: CONFIG.feeRate,
    priorityFee: CONFIG.priorityFee,
    gasSatFee: CONFIG.gasSatFee,
    bytecode,
    calldata: undefined,  // No constructor args needed
    challenge,
    randomBytes: crypto.randomBytes(32),
  });

  console.log('  Deployment TX built successfully.');
  console.log(`  Contract Address: ${deployResult.contractAddress}`);
  console.log(`  Contract PubKey:  ${deployResult.contractPubKey}\n`);

  // ── Broadcast funding TX ──
  console.log('  Broadcasting funding transaction...');
  const fundingResult = await provider.sendRawTransaction(
    deployResult.transaction[0],
    false,
  );
  console.log(`  Funding TX: ${fundingResult}`);

  // ── Broadcast deployment TX ──
  console.log('  Broadcasting deployment transaction...');
  const deploymentResult = await provider.sendRawTransaction(
    deployResult.transaction[1],
    false,
  );
  console.log(`  Deployment TX: ${deploymentResult}`);

  // ── Done ──
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  DEPLOYMENT SUCCESSFUL                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n  Contract Address: ${deployResult.contractAddress}`);
  console.log(`  Network:          ${CONFIG.network}`);
  console.log(`  Explorer:         https://regtest.explorer.opnet.org\n`);
  console.log('  Next steps:');
  console.log('  1. Copy the contract address above');
  console.log('  2. Paste it into frontend/src/utils/contract.ts → NEUROMARKET_ADDRESS');
  console.log('  3. Run the frontend: cd ../frontend && npm run dev\n');

  // ── Save deployment info to file ──
  const deployInfo = {
    contractAddress: deployResult.contractAddress,
    contractPubKey: deployResult.contractPubKey,
    network: CONFIG.network,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    bytecodeSize: bytecode.length,
    fundingTx: fundingResult,
    deploymentTx: deploymentResult,
  };

  const deployInfoPath = path.resolve(__dirname, '../build/deployment.json');
  fs.writeFileSync(deployInfoPath, JSON.stringify(deployInfo, null, 2));
  console.log(`  Deployment info saved to: build/deployment.json\n`);
}

// ── Run ──
deploy().catch((err) => {
  console.error('\n[FATAL] Deployment failed:\n');
  console.error(err);
  process.exit(1);
});

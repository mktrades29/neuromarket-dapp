// ═══════════════════════════════════════════════════════════════════════════════
//  NeuroMarket — Contract Entry Point
// ═══════════════════════════════════════════════════════════════════════════════
//  Every OP_NET contract needs this boilerplate to register itself with the
//  Blockchain runtime. The runtime calls Blockchain.contract() to instantiate
//  the contract on each interaction.
// ═══════════════════════════════════════════════════════════════════════════════

import { Blockchain } from '@btc-vision/btc-runtime/runtime';
import { revertOnError } from '@btc-vision/btc-runtime/runtime/abort/abort';
import { NeuroMarket } from './NeuroMarket';

// Register the NeuroMarket contract with the OP_NET runtime
Blockchain.contract = (): NeuroMarket => {
    return new NeuroMarket();
};

// Re-export runtime entry points required by the WASM host
export * from '@btc-vision/btc-runtime/runtime/exports';

// AssemblyScript abort handler — routes panics to on-chain reverts
export function abort(message: string, fileName: string, line: u32, column: u32): void {
    revertOnError(message, fileName, line, column);
}

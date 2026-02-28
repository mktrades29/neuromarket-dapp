// ═══════════════════════════════════════════════════════════════════════════════
//  NeuroMarket — Shared TypeScript Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Represents a single AI skill listing on the marketplace */
export interface SkillListing {
  id: string;
  creator: string;
  ipfsHash: string;
  price: string;        // BigInt-compatible string (e.g. "1000000000000000000")
  paymentToken: string;  // OP_20 token contract address
  isActive: boolean;
}

/** Parsed listing with display-friendly fields */
export interface SkillCardData {
  id: string;
  creator: string;
  ipfsHash: string;
  price: string;
  priceFormatted: string;  // e.g. "100 $MOTO"
  tokenSymbol: string;
  isActive: boolean;
}

/** Wallet connection state */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: string | null;
  isConnecting: boolean;
}

/** OP_WALLET provider interface (window.opnet) */
export interface OPNetProvider {
  isOPNet?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

/** Extend Window to include the OP_WALLET provider */
declare global {
  interface Window {
    opnet?: OPNetProvider;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  NeuroMarket — Shared TypeScript Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Represents a single AI skill listing on the marketplace */
export interface SkillListing {
  id: string;
  creator: string;
  ipfsHash: string;
  price: string;
  paymentToken: string;
  isActive: boolean;
}

/** Parsed listing with display-friendly fields */
export interface SkillCardData {
  id: string;
  creator: string;
  ipfsHash: string;
  price: string;
  priceFormatted: string;
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
  isOPWallet?: boolean;

  // Connection
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  disconnect: () => Promise<void>;

  // Account info
  getPublicKey: () => Promise<string>;
  getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;

  // Network
  getNetwork: () => Promise<string>;
  switchNetwork: (network: string) => Promise<void>;
  getChain: () => Promise<{ enum: string; name: string; network: string }>;

  // Signing
  signMessage: (message: string, type?: string) => Promise<string>;

  // Contract interactions
  signAndBroadcastInteraction: (params: {
    to: string;
    calldata: Uint8Array;
  }) => Promise<[unknown, unknown, unknown[], string]>;

  // Events
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

/** Extend Window to include the OP_WALLET provider */
declare global {
  interface Window {
    opnet?: OPNetProvider;
  }
}

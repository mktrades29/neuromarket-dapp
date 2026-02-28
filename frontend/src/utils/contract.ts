// ═══════════════════════════════════════════════════════════════════════════════
//  contract.ts — Helpers to interact with the NeuroMarket smart contract
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Uses the OP_WALLET extension's signAndBroadcastInteraction() method to
//  build, sign, and broadcast contract calls to the OP_NET network.
//
// ═══════════════════════════════════════════════════════════════════════════════

import type { SkillListing } from '../types';

// ── Contract address (deployed on regtest) ──
export const NEUROMARKET_ADDRESS = 'opr1sqz44xuehaxvrjztrwjk8z6exngtd6g3ftsgwr0s0';

// ── Well-known OP_20 token addresses (Regtest / Testnet placeholders) ──
export const TOKENS: Record<string, { address: string; symbol: string; decimals: number }> = {
  MOTO: {
    address: '0x0000000000000000000000000000000000000001',
    symbol: '$MOTO',
    decimals: 18,
  },
  PILL: {
    address: '0x0000000000000000000000000000000000000002',
    symbol: '$PILL',
    decimals: 18,
  },
};

// ── Helper: format a raw u256 price string to a human-readable amount ──
export function formatPrice(rawPrice: string, decimals: number = 18): string {
  const str = rawPrice.padStart(decimals + 1, '0');
  const whole = str.slice(0, str.length - decimals) || '0';
  const fraction = str.slice(str.length - decimals, str.length - decimals + 4);
  return `${whole}.${fraction}`;
}

// ── Helper: resolve a token address to its symbol ──
export function tokenSymbol(tokenAddress: string): string {
  for (const key of Object.keys(TOKENS)) {
    if (TOKENS[key].address.toLowerCase() === tokenAddress.toLowerCase()) {
      return TOKENS[key].symbol;
    }
  }
  return '$???';
}

// ── Helper: encode a string to Uint8Array (UTF-8) ──
function encodeString(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// ── Helper: encode u256 as 32-byte big-endian Uint8Array ──
function encodeU256(value: string): Uint8Array {
  const hex = BigInt(value).toString(16).padStart(64, '0');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ── Helper: encode a selector string via SHA-256 (first 4 bytes) ──
async function encodeSelector(name: string): Promise<Uint8Array> {
  const data = encodeString(name);
  const hash = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  return new Uint8Array(hash).slice(0, 4);
}

// ── Helper: concatenate multiple Uint8Arrays ──
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ── Helper: encode a string with 2-byte length prefix ──
function encodeStringWithLength(str: string): Uint8Array {
  const strBytes = encodeString(str);
  const lenBytes = new Uint8Array(2);
  lenBytes[0] = (strBytes.length >> 8) & 0xff;
  lenBytes[1] = strBytes.length & 0xff;
  return concatBytes(lenBytes, strBytes);
}

// ── Helper: encode an address (32 bytes from hex string) ──
function encodeAddress(addr: string): Uint8Array {
  const clean = addr.startsWith('0x') ? addr.slice(2) : addr;
  const padded = clean.padStart(64, '0');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Contract Read Calls (via OP_WALLET RPC)
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch a single listing by ID from the contract */
export async function getListing(listingId: string): Promise<SkillListing | null> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  try {
    const selector = await encodeSelector('getListing()');
    const calldata = concatBytes(selector, encodeU256(listingId));

    // Use signAndBroadcastInteraction for read calls too
    // (the wallet handles simulation vs. broadcast based on the call)
    const result = await window.opnet.signAndBroadcastInteraction({
      to: NEUROMARKET_ADDRESS,
      calldata,
    });

    const data = result as unknown as Record<string, unknown>;
    return {
      id: listingId,
      creator: data.creator as string,
      ipfsHash: data.ipfsHash as string,
      price: data.price as string,
      paymentToken: data.paymentToken as string,
      isActive: data.isActive as boolean,
    };
  } catch (err) {
    console.error(`[NeuroMarket] getListing(${listingId}) failed:`, err);
    return null;
  }
}

/** Fetch multiple listings (0 through count-1) */
export async function getAllListings(count: number): Promise<SkillListing[]> {
  const listings: SkillListing[] = [];
  for (let i = 0; i < count; i++) {
    const listing = await getListing(i.toString());
    if (listing && listing.isActive) {
      listings.push(listing);
    }
  }
  return listings;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Contract Write Calls (via OP_WALLET signAndBroadcastInteraction)
// ─────────────────────────────────────────────────────────────────────────────

/** List a new AI skill on the marketplace */
export async function listSkill(
  ipfsHash: string,
  price: string,
  paymentTokenAddress: string,
  decryptionKey: string,
): Promise<string> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  const selector = await encodeSelector('listSkill()');
  const calldata = concatBytes(
    selector,
    encodeStringWithLength(ipfsHash),
    encodeU256(price),
    encodeAddress(paymentTokenAddress),
    encodeStringWithLength(decryptionKey),
  );

  const [, , , txId] = await window.opnet.signAndBroadcastInteraction({
    to: NEUROMARKET_ADDRESS,
    calldata,
  });

  return txId;
}

/** Buy a listed skill — the buyer must have approved the token spend first */
export async function buySkill(listingId: string): Promise<boolean> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  const selector = await encodeSelector('buySkill()');
  const calldata = concatBytes(selector, encodeU256(listingId));

  const result = await window.opnet.signAndBroadcastInteraction({
    to: NEUROMARKET_ADDRESS,
    calldata,
  });

  return !!result;
}

/** Approve the NeuroMarket contract to spend buyer's OP_20 tokens */
export async function approveTokenSpend(
  tokenAddress: string,
  amount: string,
): Promise<boolean> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  const selector = await encodeSelector('increaseAllowance()');
  const calldata = concatBytes(
    selector,
    encodeAddress(NEUROMARKET_ADDRESS),
    encodeU256(amount),
  );

  const result = await window.opnet.signAndBroadcastInteraction({
    to: tokenAddress,
    calldata,
  });

  return !!result;
}

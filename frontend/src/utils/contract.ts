// ═══════════════════════════════════════════════════════════════════════════════
//  contract.ts — Helpers to interact with the NeuroMarket smart contract
// ═══════════════════════════════════════════════════════════════════════════════
//
//  These utilities build the correct calldata payloads and dispatch them via
//  the OP_WALLET extension (window.opnet). In a production app these would use
//  the @btc-vision/transaction SDK; for the hackathon demo we build the RPC
//  calls manually.
//
// ═══════════════════════════════════════════════════════════════════════════════

import type { SkillListing } from '../types';

// ── Contract address (set after deployment) ──
// Replace this with the actual deployed NeuroMarket contract address
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

// ─────────────────────────────────────────────────────────────────────────────
//  Contract Read Calls (via OP_WALLET RPC)
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch a single listing by ID from the contract */
export async function getListing(listingId: string): Promise<SkillListing | null> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  try {
    const result = await window.opnet.request({
      method: 'call',
      params: [
        {
          to: NEUROMARKET_ADDRESS,
          data: {
            selector: 'getListing()',
            params: [{ type: 'uint256', value: listingId }],
          },
        },
      ],
    });

    // Parse the response into our SkillListing type
    const data = result as Record<string, unknown>;
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
//  Contract Write Calls (via OP_WALLET RPC)
// ─────────────────────────────────────────────────────────────────────────────

/** List a new AI skill on the marketplace */
export async function listSkill(
  ipfsHash: string,
  price: string,
  paymentTokenAddress: string,
  decryptionKey: string,
): Promise<string> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  const result = await window.opnet.request({
    method: 'sendTransaction',
    params: [
      {
        to: NEUROMARKET_ADDRESS,
        data: {
          selector: 'listSkill()',
          params: [
            { type: 'string', value: ipfsHash },
            { type: 'uint256', value: price },
            { type: 'address', value: paymentTokenAddress },
            { type: 'string', value: decryptionKey },
          ],
        },
      },
    ],
  });

  return result as string; // Returns listing ID
}

/** Buy a listed skill — the buyer must have approved the token spend first */
export async function buySkill(listingId: string): Promise<boolean> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  const result = await window.opnet.request({
    method: 'sendTransaction',
    params: [
      {
        to: NEUROMARKET_ADDRESS,
        data: {
          selector: 'buySkill()',
          params: [{ type: 'uint256', value: listingId }],
        },
      },
    ],
  });

  return !!result;
}

/** Approve the NeuroMarket contract to spend buyer's OP_20 tokens */
export async function approveTokenSpend(
  tokenAddress: string,
  amount: string,
): Promise<boolean> {
  if (!window.opnet) throw new Error('OP_WALLET not available');

  const result = await window.opnet.request({
    method: 'sendTransaction',
    params: [
      {
        to: tokenAddress,
        data: {
          selector: 'increaseAllowance()',
          params: [
            { type: 'address', value: NEUROMARKET_ADDRESS },
            { type: 'uint256', value: amount },
          ],
        },
      },
    ],
  });

  return !!result;
}

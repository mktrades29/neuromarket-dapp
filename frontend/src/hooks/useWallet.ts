// ═══════════════════════════════════════════════════════════════════════════════
//  useWallet — Hook for OP_WALLET (window.opnet) integration
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '../types';

const INITIAL_STATE: WalletState = {
  isConnected: false,
  address: null,
  network: null,
  isConnecting: false,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_STATE);

  // ── Detect if OP_WALLET extension is installed ──
  const isAvailable = typeof window !== 'undefined' && !!window.opnet;

  // ── Connect to the wallet ──
  const connect = useCallback(async () => {
    if (!window.opnet) {
      alert('OP_WALLET extension not detected. Please install it first.');
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true }));

    try {
      // Request account access from the wallet extension
      const accounts = (await window.opnet.request({
        method: 'connect',
      })) as string[];

      const address = Array.isArray(accounts) ? accounts[0] : (accounts as string);

      // Get the current network
      const network = (await window.opnet.request({
        method: 'getNetwork',
      })) as string;

      setWallet({
        isConnected: true,
        address: address ?? null,
        network: network ?? 'mainnet',
        isConnecting: false,
      });
    } catch (err) {
      console.error('[NeuroMarket] Wallet connection failed:', err);
      setWallet({ ...INITIAL_STATE, isConnecting: false });
    }
  }, []);

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    setWallet(INITIAL_STATE);
  }, []);

  // ── Listen for account/network changes ──
  useEffect(() => {
    if (!window.opnet) return;

    const handleAccountChange = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setWallet(INITIAL_STATE);
      } else {
        setWallet((prev) => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleNetworkChange = (...args: unknown[]) => {
      const network = args[0] as string;
      setWallet((prev) => ({ ...prev, network }));
    };

    window.opnet.on('accountsChanged', handleAccountChange);
    window.opnet.on('networkChanged', handleNetworkChange);

    return () => {
      window.opnet?.removeListener('accountsChanged', handleAccountChange);
      window.opnet?.removeListener('networkChanged', handleNetworkChange);
    };
  }, []);

  return {
    ...wallet,
    isAvailable,
    connect,
    disconnect,
  };
}

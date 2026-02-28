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
  const [isAvailable, setIsAvailable] = useState(
    typeof window !== 'undefined' && !!window.opnet,
  );

  // ── Listen for the wallet extension to finish injecting ──
  useEffect(() => {
    if (window.opnet) {
      setIsAvailable(true);
      return;
    }

    // OP_WALLET dispatches this event once the provider is injected
    const onInit = () => setIsAvailable(true);
    window.addEventListener('opnet#initialized', onInit);
    return () => window.removeEventListener('opnet#initialized', onInit);
  }, []);

  // ── Auto-reconnect if already authorized ──
  useEffect(() => {
    if (!window.opnet) return;

    (async () => {
      try {
        const accounts = await window.opnet!.getAccounts();
        if (accounts.length > 0) {
          const network = await window.opnet!.getNetwork();
          setWallet({
            isConnected: true,
            address: accounts[0],
            network: network ?? 'regtest',
            isConnecting: false,
          });
        }
      } catch {
        // Not previously authorized — that's fine
      }
    })();
  }, [isAvailable]);

  // ── Connect to the wallet (prompts user approval popup) ──
  const connect = useCallback(async () => {
    if (!window.opnet) {
      window.open(
        'https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb',
        '_blank',
      );
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true }));

    try {
      // requestAccounts() opens the OP_WALLET approval popup
      const accounts = await window.opnet.requestAccounts();

      if (!accounts || accounts.length === 0) {
        setWallet({ ...INITIAL_STATE, isConnecting: false });
        return;
      }

      const network = await window.opnet.getNetwork();

      setWallet({
        isConnected: true,
        address: accounts[0],
        network: network ?? 'regtest',
        isConnecting: false,
      });
    } catch (err) {
      console.error('[NeuroMarket] Wallet connection failed:', err);
      setWallet({ ...INITIAL_STATE, isConnecting: false });
    }
  }, []);

  // ── Disconnect ──
  const disconnect = useCallback(async () => {
    try {
      await window.opnet?.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    setWallet(INITIAL_STATE);
  }, []);

  // ── Listen for account/network changes ──
  useEffect(() => {
    if (!window.opnet) return;

    const handleAccountChange = (accounts: unknown) => {
      const accs = accounts as string[];
      if (!accs || accs.length === 0) {
        setWallet(INITIAL_STATE);
      } else {
        setWallet((prev) => ({ ...prev, address: accs[0] }));
      }
    };

    const handleNetworkChange = (data: unknown) => {
      const info = data as { network?: string; chainType?: string };
      const network = info?.network ?? (data as string);
      setWallet((prev) => ({ ...prev, network }));
    };

    const handleDisconnect = () => {
      setWallet(INITIAL_STATE);
    };

    window.opnet.on('accountsChanged', handleAccountChange);
    window.opnet.on('networkChanged', handleNetworkChange);
    window.opnet.on('disconnect', handleDisconnect);

    return () => {
      window.opnet?.removeListener('accountsChanged', handleAccountChange);
      window.opnet?.removeListener('networkChanged', handleNetworkChange);
      window.opnet?.removeListener('disconnect', handleDisconnect);
    };
  }, [isAvailable]);

  return {
    ...wallet,
    isAvailable,
    connect,
    disconnect,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Header — Top nav bar with logo + wallet connection
// ═══════════════════════════════════════════════════════════════════════════════

import { useWalletContext } from '../context/WalletContext';
import { HiOutlineStatusOnline } from 'react-icons/hi';
import './Header.css';

export function Header() {
  const { isConnected, address, isConnecting, isAvailable, connect, disconnect } =
    useWalletContext();

  // Shorten address for display: "bc1q...x4f2"
  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <header className="header">
      {/* ── Logo ── */}
      <div className="header__logo">
        <span className="header__icon">&#x2B22;</span>
        <h1 className="header__title">
          Neuro<span className="header__title--accent">Market</span>
        </h1>
        <span className="header__tagline">AI Skill Marketplace on Bitcoin</span>
      </div>

      {/* ── Wallet Connection ── */}
      <div className="header__wallet">
        {isConnected ? (
          <>
            <span className="header__status">
              <HiOutlineStatusOnline className="header__status-icon" />
              {shortAddr}
            </span>
            <button className="btn btn--cyan" onClick={disconnect}>
              Disconnect
            </button>
          </>
        ) : (
          <button
            className="btn btn--solid"
            onClick={connect}
            disabled={isConnecting || !isAvailable}
          >
            {!isAvailable
              ? 'Install OP_WALLET'
              : isConnecting
                ? 'Connecting...'
                : 'Connect Wallet'}
          </button>
        )}
      </div>
    </header>
  );
}

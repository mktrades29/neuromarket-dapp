// ═══════════════════════════════════════════════════════════════════════════════
//  Header — Top nav bar with logo + wallet connection
// ═══════════════════════════════════════════════════════════════════════════════

import { useWalletContext } from '../context/WalletContext';
import { useToast } from './Toast';
import { HiOutlineStatusOnline } from 'react-icons/hi';
import './Header.css';

const OPWALLET_URL =
  'https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb';

export function Header() {
  const { isConnected, address, isConnecting, isAvailable, connect, disconnect } =
    useWalletContext();
  const { toast } = useToast();

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const handleConnect = async () => {
    if (!isAvailable) {
      // No wallet detected — open the Chrome Web Store install page
      toast('Opening OP_WALLET install page...', 'info');
      window.open(OPWALLET_URL, '_blank');
      return;
    }

    try {
      await connect();
      toast('Wallet connected!', 'success');
    } catch {
      toast('Connection failed. Please try again.', 'error');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    toast('Wallet disconnected.', 'info');
  };

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
            <button className="btn btn--cyan" onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        ) : (
          <button
            className="btn btn--solid"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting
              ? 'Connecting...'
              : isAvailable
                ? 'Connect Wallet'
                : 'Install OP_WALLET'}
          </button>
        )}
      </div>
    </header>
  );
}

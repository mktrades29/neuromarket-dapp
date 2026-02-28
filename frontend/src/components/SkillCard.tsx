// ═══════════════════════════════════════════════════════════════════════════════
//  SkillCard — Displays a single AI skill listing in the marketplace grid
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { HiOutlineCube, HiOutlineDownload } from 'react-icons/hi';
import { useWalletContext } from '../context/WalletContext';
import { useToast } from './Toast';
import { buySkill, approveTokenSpend, formatPrice, tokenSymbol } from '../utils/contract';
import type { SkillListing } from '../types';
import './SkillCard.css';

// Skill type labels for visual variety
const SKILL_TYPES = [
  { label: 'Trading Bot', color: 'var(--neon-cyan)' },
  { label: 'CLAUDE.md Persona', color: 'var(--neon-magenta)' },
  { label: 'Python Script', color: 'var(--neon-green)' },
  { label: 'Data Pipeline', color: 'var(--neon-yellow)' },
  { label: 'Agent Toolkit', color: 'var(--neon-orange)' },
];

// Skill names for demo listings
const SKILL_NAMES = [
  'Alpha Signal Scanner',
  'DeFi Persona v2',
  'MEV Arbitrage Bot',
  'On-Chain Analytics',
  'Autonomous Trader',
  'Yield Optimizer',
];

interface SkillCardProps {
  listing: SkillListing;
}

export function SkillCard({ listing }: SkillCardProps) {
  const { isConnected, isAvailable } = useWalletContext();
  const { toast } = useToast();
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);

  const skillType = SKILL_TYPES[Number(listing.id) % SKILL_TYPES.length];
  const skillName = SKILL_NAMES[Number(listing.id) % SKILL_NAMES.length];
  const symbol = tokenSymbol(listing.paymentToken);
  const price = formatPrice(listing.price);

  const handleBuy = async () => {
    if (buying) return;

    // If wallet not connected, run demo purchase flow
    if (!isConnected) {
      setBuying(true);
      toast(`Initiating purchase of "${skillName}"...`, 'info');

      // Simulate purchase delay for demo
      await new Promise((r) => setTimeout(r, 1500));

      if (!isAvailable) {
        toast('Demo mode — install OP_WALLET for real transactions', 'info');
      } else {
        toast('Connect your wallet to complete real purchases', 'info');
      }

      setBuying(false);
      setBought(true);
      toast(`"${skillName}" purchased! Decryption key delivered.`, 'success');
      return;
    }

    // Real purchase flow with wallet
    setBuying(true);
    toast('Approving token spend...', 'info');
    try {
      await approveTokenSpend(listing.paymentToken, listing.price);
      toast('Executing purchase...', 'info');

      const success = await buySkill(listing.id);
      if (success) {
        setBought(true);
        toast(`"${skillName}" purchased successfully!`, 'success');
      }
    } catch (err) {
      console.error('[NeuroMarket] Purchase failed:', err);
      toast('Purchase failed. Check console for details.', 'error');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="skill-card glass-card animate-in">
      {/* ── Top accent bar ── */}
      <div
        className="skill-card__accent"
        style={{ background: skillType.color }}
      />

      {/* ── Header ── */}
      <div className="skill-card__header">
        <span
          className="skill-card__type"
          style={{ color: skillType.color, borderColor: skillType.color }}
        >
          {skillType.label}
        </span>
        <HiOutlineCube className="skill-card__icon" />
      </div>

      {/* ── Body ── */}
      <div className="skill-card__body">
        <h3 className="skill-card__title">{skillName}</h3>
        <p className="skill-card__creator">
          by <span className="neon-text">{listing.creator.slice(0, 10)}...</span>
        </p>
        <p className="skill-card__ipfs">
          IPFS: <code>{listing.ipfsHash.slice(0, 16)}...</code>
        </p>
      </div>

      {/* ── Footer: Price + Buy ── */}
      <div className="skill-card__footer">
        <div className="skill-card__price">
          <span className="skill-card__price-amount">{price}</span>
          <span className="skill-card__price-token">{symbol}</span>
        </div>

        {bought ? (
          <button className="btn btn--green" disabled>
            <HiOutlineDownload style={{ marginRight: '0.4rem' }} />
            Purchased
          </button>
        ) : (
          <button
            className="btn btn--magenta"
            onClick={handleBuy}
            disabled={buying}
          >
            {buying ? 'Processing...' : `Buy with ${symbol}`}
          </button>
        )}
      </div>
    </div>
  );
}

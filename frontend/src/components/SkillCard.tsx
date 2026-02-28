// ═══════════════════════════════════════════════════════════════════════════════
//  SkillCard — Displays a single AI skill listing in the marketplace grid
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { HiOutlineCube, HiOutlineDownload } from 'react-icons/hi';
import { useWalletContext } from '../context/WalletContext';
import { buySkill, approveTokenSpend, formatPrice, tokenSymbol } from '../utils/contract';
import type { SkillListing } from '../types';
import './SkillCard.css';

// Skill type labels & icons for visual variety
const SKILL_TYPES = [
  { label: 'Trading Bot', color: 'var(--neon-cyan)' },
  { label: 'CLAUDE.md Persona', color: 'var(--neon-magenta)' },
  { label: 'Python Script', color: 'var(--neon-green)' },
  { label: 'Data Pipeline', color: 'var(--neon-yellow)' },
  { label: 'Agent Toolkit', color: 'var(--neon-orange)' },
];

interface SkillCardProps {
  listing: SkillListing;
}

export function SkillCard({ listing }: SkillCardProps) {
  const { isConnected } = useWalletContext();
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);

  // Deterministic skill type based on listing ID
  const skillType = SKILL_TYPES[Number(listing.id) % SKILL_TYPES.length];
  const symbol = tokenSymbol(listing.paymentToken);
  const price = formatPrice(listing.price);

  const handleBuy = async () => {
    if (!isConnected || buying) return;

    setBuying(true);
    try {
      // Step 1: Approve the NeuroMarket contract to spend tokens
      await approveTokenSpend(listing.paymentToken, listing.price);

      // Step 2: Execute the purchase
      const success = await buySkill(listing.id);

      if (success) {
        setBought(true);
      }
    } catch (err) {
      console.error('[NeuroMarket] Purchase failed:', err);
      alert('Purchase failed. Check console for details.');
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
        <h3 className="skill-card__title">
          Skill #{listing.id}
        </h3>
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
            disabled={!isConnected || buying}
          >
            {buying ? 'Processing...' : `Buy with ${symbol}`}
          </button>
        )}
      </div>
    </div>
  );
}

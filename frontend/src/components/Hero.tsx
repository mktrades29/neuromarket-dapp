// ═══════════════════════════════════════════════════════════════════════════════
//  Hero — Landing banner with marketplace tagline and stats
// ═══════════════════════════════════════════════════════════════════════════════

import { HiOutlineLightningBolt, HiOutlineChip, HiOutlineGlobe } from 'react-icons/hi';
import './Hero.css';

export function Hero() {
  return (
    <section className="hero">
      {/* ── Scanline effect ── */}
      <div className="hero__scanline" />

      <div className="hero__content animate-in">
        <p className="hero__pre-title">&#x2590; DECENTRALIZED AI ON BITCOIN &#x258C;</p>
        <h2 className="hero__title">
          Buy &amp; Sell <span className="neon-text">AI Skills</span>
          <br />
          with <span className="neon-text--magenta">$MOTO</span> &amp;{' '}
          <span className="neon-text--green">$PILL</span>
        </h2>
        <p className="hero__subtitle">
          A decentralized App Store where autonomous AI agents and developers
          trade skills, scripts, and strategies — powered by OP_NET.
        </p>

        {/* ── Stats row ── */}
        <div className="hero__stats">
          <div className="hero__stat">
            <HiOutlineLightningBolt className="hero__stat-icon" />
            <span className="hero__stat-value">OP_NET</span>
            <span className="hero__stat-label">Bitcoin L1</span>
          </div>
          <div className="hero__stat">
            <HiOutlineChip className="hero__stat-icon" />
            <span className="hero__stat-value">OP_20</span>
            <span className="hero__stat-label">Token Standard</span>
          </div>
          <div className="hero__stat">
            <HiOutlineGlobe className="hero__stat-icon" />
            <span className="hero__stat-value">IPFS</span>
            <span className="hero__stat-label">Encrypted Storage</span>
          </div>
        </div>
      </div>
    </section>
  );
}

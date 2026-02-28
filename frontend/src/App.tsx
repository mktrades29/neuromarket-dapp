// ═══════════════════════════════════════════════════════════════════════════════
//  App — NeuroMarket main application shell
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SkillGrid } from './components/SkillGrid';
import { ListSkillModal } from './components/ListSkillModal';
import { HiOutlinePlus } from 'react-icons/hi';
import './App.css';

function App() {
  const [showListModal, setShowListModal] = useState(false);

  return (
    <>
      <Header />
      <Hero />

      {/* ── Action bar ── */}
      <div className="app__actions">
        <button
          className="btn btn--cyan"
          onClick={() => setShowListModal(true)}
        >
          <HiOutlinePlus style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          List a Skill
        </button>
      </div>

      {/* ── Marketplace grid ── */}
      <SkillGrid />

      {/* ── Footer ── */}
      <footer className="app__footer">
        <p>
          NeuroMarket &mdash; Decentralized AI Skill Marketplace on Bitcoin
        </p>
        <p className="app__footer-sub">
          Powered by OP_NET &bull; Built for Vibecode
        </p>
      </footer>

      {/* ── List Skill Modal ── */}
      <ListSkillModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
      />
    </>
  );
}

export default App;

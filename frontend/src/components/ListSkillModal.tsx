// ═══════════════════════════════════════════════════════════════════════════════
//  ListSkillModal — Modal form for creators to list a new AI skill
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, type FormEvent } from 'react';
import { HiOutlineUpload, HiOutlineX } from 'react-icons/hi';
import { listSkill, TOKENS } from '../utils/contract';
import './ListSkillModal.css';

interface ListSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ListSkillModal({ isOpen, onClose }: ListSkillModalProps) {
  const [ipfsHash, setIpfsHash] = useState('');
  const [price, setPrice] = useState('');
  const [token, setToken] = useState('MOTO');
  const [decryptionKey, setDecryptionKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ipfsHash || !price || !decryptionKey) return;

    setSubmitting(true);
    try {
      // Convert human-readable price to raw u256 (multiply by 10^18)
      const rawPrice = price + '000000000000000000';

      const listingId = await listSkill(
        ipfsHash,
        rawPrice,
        TOKENS[token].address,
        decryptionKey,
      );

      alert(`Skill listed successfully! Listing ID: ${listingId}`);
      onClose();
    } catch (err) {
      console.error('[NeuroMarket] List skill failed:', err);
      alert('Failed to list skill. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="modal__header">
          <h3 className="modal__title">
            <HiOutlineUpload /> List New Skill
          </h3>
          <button className="modal__close" onClick={onClose}>
            <HiOutlineX />
          </button>
        </div>

        {/* ── Form ── */}
        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label className="modal__label">IPFS Hash</label>
            <input
              className="modal__input"
              type="text"
              placeholder="QmX7bVbPRGhN..."
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              required
            />
            <span className="modal__hint">CID of your encrypted skill file on IPFS</span>
          </div>

          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Price</label>
              <input
                className="modal__input"
                type="number"
                placeholder="100"
                min="1"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="modal__field">
              <label className="modal__label">Token</label>
              <select
                className="modal__input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              >
                <option value="MOTO">$MOTO</option>
                <option value="PILL">$PILL</option>
              </select>
            </div>
          </div>

          <div className="modal__field">
            <label className="modal__label">Decryption Key</label>
            <input
              className="modal__input"
              type="text"
              placeholder="Your secret decryption key..."
              value={decryptionKey}
              onChange={(e) => setDecryptionKey(e.target.value)}
              required
            />
            <span className="modal__hint">
              Buyers receive this key after payment to unlock the IPFS file
            </span>
          </div>

          <button
            className="btn btn--solid modal__submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Listing...' : 'List Skill on NeuroMarket'}
          </button>
        </form>
      </div>
    </div>
  );
}

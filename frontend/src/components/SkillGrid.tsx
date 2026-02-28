// ═══════════════════════════════════════════════════════════════════════════════
//  SkillGrid — Grid of listed AI skills, with demo data fallback
// ═══════════════════════════════════════════════════════════════════════════════

import { SkillCard } from './SkillCard';
import type { SkillListing } from '../types';
import { TOKENS } from '../utils/contract';
import './SkillGrid.css';

// ── Demo listings for when the contract isn't deployed yet ──
const DEMO_LISTINGS: SkillListing[] = [
  {
    id: '0',
    creator: 'bc1q9h5yjqka2yv3msd7f3c5f0he2x4rn0vef5fakx',
    ipfsHash: 'QmX7bVbPRGhNiiCBpE1MFFcLnRSHP3keTY8Y4N3J2v9dRc',
    price: '50000000000000000000',
    paymentToken: TOKENS.MOTO.address,
    isActive: true,
  },
  {
    id: '1',
    creator: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    price: '125000000000000000000',
    paymentToken: TOKENS.PILL.address,
    isActive: true,
  },
  {
    id: '2',
    creator: 'bc1q5ypq2ekl0e7kxf4g3v5x7d3nqwvqhj7h7c5m9u',
    ipfsHash: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
    price: '75000000000000000000',
    paymentToken: TOKENS.MOTO.address,
    isActive: true,
  },
  {
    id: '3',
    creator: 'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h',
    ipfsHash: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB',
    price: '200000000000000000000',
    paymentToken: TOKENS.MOTO.address,
    isActive: true,
  },
  {
    id: '4',
    creator: 'bc1q7fn4snfx3yv86nm2vc7kw3h0q5zry37dxaewfa',
    ipfsHash: 'QmRf22bZar3WKmojipms22PkXH1MZGmvsqzQtuSvQE3uhm',
    price: '350000000000000000000',
    paymentToken: TOKENS.PILL.address,
    isActive: true,
  },
  {
    id: '5',
    creator: 'bc1q2h6pf6gvm0gxqd34rjm0hq6g9v5s79a3s2h9k4',
    ipfsHash: 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX',
    price: '90000000000000000000',
    paymentToken: TOKENS.MOTO.address,
    isActive: true,
  },
];

interface SkillGridProps {
  listings?: SkillListing[];
}

export function SkillGrid({ listings }: SkillGridProps) {
  // Use demo data if no live listings are provided
  const data = listings && listings.length > 0 ? listings : DEMO_LISTINGS;

  return (
    <section className="skill-grid-section">
      <div className="skill-grid-header">
        <h2 className="skill-grid-title">
          <span className="neon-text--magenta">&#x25C8;</span>{' '}
          Available Skills
        </h2>
        <p className="skill-grid-subtitle">
          {data.length} AI agents & skills listed on-chain
        </p>
      </div>

      <div className="skill-grid">
        {data.map((listing) => (
          <SkillCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

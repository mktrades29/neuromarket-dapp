import { u256 } from '@btc-vision/as-bignum/assembly';
import { NetEvent } from '@btc-vision/btc-runtime/runtime/events/NetEvent';
import { BytesWriter } from '@btc-vision/btc-runtime/runtime/buffer/BytesWriter';
import { Address } from '@btc-vision/btc-runtime/runtime/types/Address';

// ─────────────────────────────────────────────────────────────────────────────
// SkillPurchasedEvent
// Emitted when a buyer successfully purchases an AI skill.
// The buyer's frontend listens for this event to retrieve the decryption key
// needed to unlock the encrypted IPFS file.
//
// Data layout (96 bytes):
//   [0..31]  listingId  (u256)   — which listing was purchased
//   [32..63] buyer      (Address) — who bought it
//   [64..95] creator    (Address) — who gets paid
// ─────────────────────────────────────────────────────────────────────────────

const ADDRESS_BYTE_LENGTH: i32 = 32;
const U256_BYTE_LENGTH: i32 = 32;

@final
export class SkillPurchasedEvent extends NetEvent {
    constructor(listingId: u256, buyer: Address, creator: Address) {
        // Allocate: listingId(32) + buyer(32) + creator(32) = 96 bytes
        const data = new BytesWriter(U256_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + ADDRESS_BYTE_LENGTH);
        data.writeU256(listingId);
        data.writeAddress(buyer);
        data.writeAddress(creator);

        super('SkillPurchased', data);
    }
}

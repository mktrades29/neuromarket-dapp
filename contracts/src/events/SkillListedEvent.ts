import { u256 } from '@btc-vision/as-bignum/assembly';
import { NetEvent } from '@btc-vision/btc-runtime/runtime/events/NetEvent';
import { BytesWriter } from '@btc-vision/btc-runtime/runtime/buffer/BytesWriter';
import { Address } from '@btc-vision/btc-runtime/runtime/types/Address';

// ─────────────────────────────────────────────────────────────────────────────
// SkillListedEvent
// Emitted when a creator lists a new AI skill on the marketplace.
//
// Data layout (96 bytes):
//   [0..31]  listingId  (u256)  — unique ID for this listing
//   [32..63] creator    (Address / 32 bytes) — the seller's address
//   [64..95] price      (u256)  — cost in the specified OP_20 token
// ─────────────────────────────────────────────────────────────────────────────

const ADDRESS_BYTE_LENGTH: i32 = 32;
const U256_BYTE_LENGTH: i32 = 32;

@final
export class SkillListedEvent extends NetEvent {
    constructor(listingId: u256, creator: Address, price: u256) {
        // Allocate: listingId(32) + creator(32) + price(32) = 96 bytes
        const data = new BytesWriter(U256_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH);
        data.writeU256(listingId);
        data.writeAddress(creator);
        data.writeU256(price);

        super('SkillListed', data);
    }
}

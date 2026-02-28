// ═══════════════════════════════════════════════════════════════════════════════
//  NeuroMarket.ts — Decentralized AI Skill Marketplace on Bitcoin (OP_NET)
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Creators list encrypted AI skills (scripts, personas, strategies) on IPFS
//  and set an OP_20 token price ($MOTO, $PILL, etc.). Buyers pay via on-chain
//  token transfer and receive the decryption key through an emitted event.
//
//  SECURITY NOTE (Hackathon Scope):
//  The decryption key is stored on-chain in plaintext. In production, it would
//  be encrypted per-buyer using their public key (hybrid encryption). For this
//  demo, the key is emitted in the SkillPurchased event and readable by the
//  buyer's frontend.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    Blockchain,
    BytesWriter,
    Calldata,
    encodeSelector,
    OP_NET,
    Revert,
    SafeMath,
    Selector,
    StoredString,
    StoredU256,
} from '@btc-vision/btc-runtime/runtime';
import { StoredMapU256 } from '@btc-vision/btc-runtime/runtime/storage/maps/StoredMapU256';

import { SkillListedEvent } from './events/SkillListedEvent';
import { SkillPurchasedEvent } from './events/SkillPurchasedEvent';

// ─── Constants ───────────────────────────────────────────────────────────────

const ADDRESS_BYTE_LENGTH: i32 = 32;
const U256_BYTE_LENGTH: i32 = 32;
const SELECTOR_BYTE_LENGTH: i32 = 4;

// u256 sentinels for boolean encoding in StoredMapU256
const U256_TRUE: u256 = u256.One;
const U256_FALSE: u256 = u256.Zero;

// ─── NeuroMarket Contract ───────────────────────────────────────────────────

@final
export class NeuroMarket extends OP_NET {
    // ── Storage ─────────────────────────────────────────────────────────────
    //
    // Global counter (single value):
    //   nextListingId — StoredU256 with empty 30-byte sub-pointer
    //
    // Per-listing mappings (listingId → value):
    //   creatorMap      — StoredMapU256: listingId → creator address (as u256)
    //   priceMap        — StoredMapU256: listingId → price (u256)
    //   paymentTokenMap — StoredMapU256: listingId → payment token address (as u256)
    //   isActiveMap     — StoredMapU256: listingId → 1 (active) or 0 (inactive)
    //
    // Per-listing strings (index-based):
    //   ipfsHash        — StoredString(pointer, listingId) per listing
    //   decryptionKey   — StoredString(pointer, listingId) per listing

    // Global listing counter
    private nextListingId: StoredU256 = new StoredU256(
        Blockchain.nextPointer,
        new Uint8Array(30),
    );

    // Per-listing address/numeric fields stored as u256 maps
    private creatorMap: StoredMapU256 = new StoredMapU256(Blockchain.nextPointer);
    private priceMap: StoredMapU256 = new StoredMapU256(Blockchain.nextPointer);
    private paymentTokenMap: StoredMapU256 = new StoredMapU256(Blockchain.nextPointer);
    private isActiveMap: StoredMapU256 = new StoredMapU256(Blockchain.nextPointer);

    // Per-listing string field pointers (each listing uses a different index)
    private readonly ipfsHashPtr: u16 = Blockchain.nextPointer;
    private readonly decryptionKeyPtr: u16 = Blockchain.nextPointer;

    // ── Constructor ──────────────────────────────────────────────────────────
    // NOTE: Runs on EVERY contract interaction (not just deployment).

    constructor() {
        super();
    }

    // ── Deployment (one-time init, like Solidity constructor) ────────────────

    public override onDeployment(_calldata: Calldata): void {
        // nextListingId defaults to 0. No extra init needed.
    }

    // ── Method Dispatch ─────────────────────────────────────────────────────
    // Routes incoming calls to the correct handler based on the 4-byte selector.

    public override execute(method: Selector, calldata: Calldata): BytesWriter {
        switch (method) {
            case encodeSelector('listSkill()'):
                return this.listSkill(calldata);

            case encodeSelector('buySkill()'):
                return this.buySkill(calldata);

            case encodeSelector('getListing()'):
                return this.getListing(calldata);

            case encodeSelector('delistSkill()'):
                return this.delistSkill(calldata);

            default:
                return super.execute(method, calldata);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PUBLIC METHODS
    // ═════════════════════════════════════════════════════════════════════════

    // ── listSkill ────────────────────────────────────────────────────────────
    // Allows a creator to list a new AI skill for sale.
    //
    // Calldata:
    //   ipfsHash       (string)  — IPFS CID of the encrypted skill file
    //   price          (u256)    — cost in the specified OP_20 token
    //   paymentToken   (Address) — address of the OP_20 token accepted
    //   decryptionKey  (string)  — key to decrypt the IPFS file after purchase
    //
    // Returns:
    //   listingId      (u256)    — the unique ID assigned to this listing

    private listSkill(calldata: Calldata): BytesWriter {
        const sender: Address = Blockchain.tx.sender;

        // Read parameters from calldata
        const ipfsHash: string = calldata.readStringWithLength();
        const price: u256 = calldata.readU256();
        const paymentToken: Address = calldata.readAddress();
        const decryptionKey: string = calldata.readStringWithLength();

        // Validate inputs
        if (price == u256.Zero) {
            throw new Revert('Price must be greater than zero');
        }

        // Assign a unique listing ID and increment the counter
        const listingId: u256 = this.nextListingId.value;
        this.nextListingId.set(SafeMath.add(listingId, u256.One));

        // Listing ID as u64 for StoredString index
        const listingIndex: u64 = listingId.lo1;

        // ── Persist all listing fields to on-chain storage ──

        // Store creator address as u256
        this.creatorMap.set(listingId, this.addressToU256(sender));

        // Store IPFS hash as string
        const ipfsStore = new StoredString(this.ipfsHashPtr, listingIndex);
        ipfsStore.value = ipfsHash;

        // Store price
        this.priceMap.set(listingId, price);

        // Store payment token address as u256
        this.paymentTokenMap.set(listingId, this.addressToU256(paymentToken));

        // Store decryption key as string
        const keyStore = new StoredString(this.decryptionKeyPtr, listingIndex);
        keyStore.value = decryptionKey;

        // Mark listing as active
        this.isActiveMap.set(listingId, U256_TRUE);

        // Emit the SkillListed event
        this.emitEvent(new SkillListedEvent(listingId, sender, price));

        // Return the listing ID to the caller
        const response = new BytesWriter(U256_BYTE_LENGTH);
        response.writeU256(listingId);
        return response;
    }

    // ── buySkill ─────────────────────────────────────────────────────────────
    // Allows a buyer to purchase a listed AI skill.
    //
    // Flow:
    //   1. Validate listing exists and is active
    //   2. Call transferFrom() on the OP_20 token contract
    //      (buyer must have pre-approved this contract via increaseAllowance)
    //   3. Emit SkillPurchased event so buyer's frontend gets the decryption key
    //
    // Calldata:
    //   listingId  (u256)  — ID of the skill to purchase
    //
    // Returns:
    //   success    (boolean)

    private buySkill(calldata: Calldata): BytesWriter {
        const buyer: Address = Blockchain.tx.sender;
        const listingId: u256 = calldata.readU256();

        // ── Load listing data from storage ──
        const isActive: u256 = this.isActiveMap.get(listingId);
        if (isActive == U256_FALSE) {
            throw new Revert('Listing is not active or does not exist');
        }

        const price: u256 = this.priceMap.get(listingId);
        const paymentToken: Address = this.u256ToAddress(this.paymentTokenMap.get(listingId));
        const creator: Address = this.u256ToAddress(this.creatorMap.get(listingId));

        // ── Execute the OP_20 transferFrom: buyer → creator ──
        // The buyer must have already called increaseAllowance() on the token
        // contract to allow this NeuroMarket contract to spend their tokens.
        this.executeTransferFrom(paymentToken, buyer, creator, price);

        // ── Emit purchase event ──
        // The buyer's frontend watches for this event to retrieve the
        // decryption key from the listing's on-chain storage.
        this.emitEvent(new SkillPurchasedEvent(listingId, buyer, creator));

        // Return success
        const response = new BytesWriter(1);
        response.writeBoolean(true);
        return response;
    }

    // ── getListing ───────────────────────────────────────────────────────────
    // Returns the public details of a listing (everything except decryptionKey).
    //
    // Calldata:
    //   listingId  (u256)
    //
    // Returns:
    //   creator       (Address)
    //   ipfsHash      (string)
    //   price         (u256)
    //   paymentToken  (Address)
    //   isActive      (boolean)

    private getListing(calldata: Calldata): BytesWriter {
        const listingId: u256 = calldata.readU256();
        const listingIndex: u64 = listingId.lo1;

        // Load each field from storage
        const creator: Address = this.u256ToAddress(this.creatorMap.get(listingId));

        const ipfsStore = new StoredString(this.ipfsHashPtr, listingIndex);
        const ipfsHash: string = ipfsStore.value;

        const price: u256 = this.priceMap.get(listingId);
        const paymentToken: Address = this.u256ToAddress(this.paymentTokenMap.get(listingId));
        const isActive: bool = this.isActiveMap.get(listingId) == U256_TRUE;

        // Pack the response
        const response = new BytesWriter(
            ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + 1 + 256,
        );
        response.writeAddress(creator);
        response.writeStringWithLength(ipfsHash);
        response.writeU256(price);
        response.writeAddress(paymentToken);
        response.writeBoolean(isActive);
        return response;
    }

    // ── delistSkill ─────────────────────────────────────────────────────────
    // Allows the original creator to deactivate their listing.
    //
    // Calldata:
    //   listingId  (u256)
    //
    // Returns:
    //   success    (boolean)

    private delistSkill(calldata: Calldata): BytesWriter {
        const sender: Address = Blockchain.tx.sender;
        const listingId: u256 = calldata.readU256();

        // Verify the caller is the original creator
        const creator: Address = this.u256ToAddress(this.creatorMap.get(listingId));

        if (!creator.equals(sender)) {
            throw new Revert('Only the creator can delist a skill');
        }

        // Verify listing is currently active
        const isActive: u256 = this.isActiveMap.get(listingId);
        if (isActive == U256_FALSE) {
            throw new Revert('Listing is already inactive');
        }

        // Deactivate the listing
        this.isActiveMap.set(listingId, U256_FALSE);

        const response = new BytesWriter(1);
        response.writeBoolean(true);
        return response;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  INTERNAL HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    // ── executeTransferFrom ─────────────────────────────────────────────────
    // Performs a cross-contract call to an OP_20 token's transferFrom method.
    //
    // This moves `amount` tokens from `from` to `to`, requiring that `from`
    // has previously approved this contract via increaseAllowance().

    private executeTransferFrom(
        tokenAddress: Address,
        from: Address,
        to: Address,
        amount: u256,
    ): void {
        // Build the calldata for: transferFrom(from, to, amount)
        // Layout: selector(4) + from(32) + to(32) + amount(32) = 100 bytes
        const transferCalldata = new BytesWriter(
            SELECTOR_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH,
        );
        transferCalldata.writeSelector(encodeSelector('transferFrom()'));
        transferCalldata.writeAddress(from);
        transferCalldata.writeAddress(to);
        transferCalldata.writeU256(amount);

        // Execute the cross-contract call
        const result = Blockchain.call(tokenAddress, transferCalldata);

        // Verify the call succeeded
        if (!result.data.readBoolean()) {
            throw new Revert('OP_20 transferFrom failed — check buyer allowance');
        }
    }

    // ── Address ↔ u256 Conversion ───────────────────────────────────────────
    // Address is a 32-byte Uint8Array, u256 is also 32 bytes.
    // We store addresses as u256 in StoredMapU256 for keyed lookups.

    private addressToU256(addr: Address): u256 {
        return u256.fromUint8ArrayBE(addr);
    }

    private u256ToAddress(val: u256): Address {
        return Address.fromUint8Array(val.toUint8Array(true));
    }
}

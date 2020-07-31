/* global window */
/* eslint-disable no-bitwise */

import * as base64js from 'base64-js';

// Megolm constants, must keep them in sync with libolm.
//

const MEGOLM_SESSION_VERSION = 0x02;
const MEGOLM_RATCHET_PARTS = 4;
const MEGOLM_RATCHET_PART_LENGTH = 32;
const MEGOLM_INFO = new TextEncoder().encode('MEGOLM_KEYS');
const HASH_KEY_SEEDS = [
    new Uint8Array([ 0 ]),
    new Uint8Array([ 1 ]),
    new Uint8Array([ 2 ]),
    new Uint8Array([ 3 ])
];

// Megolm extension constants.
//

const XMEGOLM_EXPORT_VERSION = 0x01;


type RatchetData = Array<Uint8Array>;

interface RatchetState {
    counter: number;
    data: RatchetData;
}

interface Keys {
    aesKey: CryptoKey;
    macKey: CryptoKey;
    aesIv: Uint8Array;
}

export * as OlmUtils from './olmutils';

/**
 * Megolm.js is a JavaScript implementation of the Megolm cryptographic ratchet.
 * It is intended to be used standalone, but it's interoperable with libolm's
 * implementation.
 */
export class Megolm {
    /**
     * Helper to generate a random initial ratchet state.
     */
    private static getRandomInitialState(): RatchetState {
        const data: RatchetData = [];

        for (let i = 0; i < MEGOLM_RATCHET_PARTS; i++) {
            const part = new Uint8Array(MEGOLM_RATCHET_PART_LENGTH);

            data.push(window.crypto.getRandomValues(part));
        }

        return {
            counter: 0,
            data
        };
    }

    /**
     * Current set of keys.
     */
    private _keys?: Keys;

    /**
     * The current ratchet state and counter.
     */
    private _state: RatchetState;

    /**
     * Imports a Megolm object which has been exported with Megolm.export.
     */
    static import(importData: string): Megolm {
        const adjustedSize = Math.round(importData.length / 4) * 4; // Must be a multiple of 4.
        const bytes = Uint8Array.from(base64js.toByteArray(importData.padEnd(adjustedSize, '=')));
        const view = new DataView(bytes.buffer);
        const v = view.getUint8(0);

        if (v !== XMEGOLM_EXPORT_VERSION) {
            throw new Error(`Unexpected export version: ${v}`);
        }

        if (bytes.byteLength !== 133) {
            throw new Error(`Invalid payload length: ${bytes.byteLength}`);
        }

        const state = {
            counter: view.getUint32(1),
            data: [
                bytes.subarray(5, 37),
                bytes.subarray(37, 69),
                bytes.subarray(69, 101),
                bytes.subarray(101, 133)
            ]
        };

        return new Megolm(state);
    }

    /**
     * Builds a Megolm object from the shared session format used by libolm's
     * OutgoingSession.session_key() method.
     */
    static fromSharedSession(sessionKey: string): Megolm {
        // libolm shared session format
        // https://gitlab.matrix.org/matrix-org/olm/-/blob/master/docs/megolm.md#session-sharing-format
        //
        // +---+----+--------+--------+--------+--------+------+-----------+
        // | V | i  | R(i,0) | R(i,1) | R(i,2) | R(i,3) | Kpub | Signature |
        // +---+----+--------+--------+--------+--------+------+-----------+
        // 0   1    5        37       69      101      133    165         229

        const adjustedSize = Math.round(sessionKey.length / 4) * 4; // Must be a multiple of 4.
        const bytes = Uint8Array.from(base64js.toByteArray(sessionKey.padEnd(adjustedSize, '=')));
        const view = new DataView(bytes.buffer);
        const v = view.getUint8(0);

        if (v !== MEGOLM_SESSION_VERSION) {
            throw new Error(`Unexpected session version: ${v}`);
        }

        const state = {
            counter: view.getUint32(1),
            data: [
                bytes.slice(5, 37),
                bytes.slice(37, 69),
                bytes.slice(69, 101),
                bytes.slice(101, 133)
            ]
        };

        return new Megolm(state);
    }

    /**
     * Builds a new Megolm instance. The given initial state can be used to restore
     * a previously saved ratchet state.
     */
    constructor(initialState?: RatchetState) {
        if (initialState) {
            this._state = this._cloneState(initialState);
        } else {
            this._state = Megolm.getRandomInitialState();
        }
    }

    /**
     * Advances the ratched by one step.
     */
    async advance(): Promise<void> {
        let mask = 0x00ffffff;
        let h = 0;

        this._state.counter++;

        while (h < MEGOLM_RATCHET_PARTS) {
            if (!(this._state.counter & mask)) {
                break;
            }

            h++;
            mask = mask >>> 8;
        }

        for (let i = MEGOLM_RATCHET_PARTS - 1; i >= h; i--) {
            await this._rehashPart(h, i);
        }

        await this._updateKeys();
    }

    /**
     * Advances the ratchet the given number of steps.
     */
    async advanceTo(idx: number): Promise<void> {
        for (let j = 0; j < MEGOLM_RATCHET_PARTS; j++) {
            const shift = (MEGOLM_RATCHET_PARTS - j - 1) * 8;
            const mask = (~0 << shift) >>> 0;
            const steps1 = (idx >>> shift) >>> 0;
            const steps2 = (this._state.counter >>> shift) >>> 0;
            let steps = ((steps1 - steps2) & 0xff) >>> 0;

            if (steps === 0) {
                if (idx < this._state.counter) {
                    steps = 0x100;
                } else {
                    // eslint-disable-next-line no-continue
                    continue;
                }
            }

            while (steps > 1) {
                await this._rehashPart(j, j);
                steps--;
            }

            for (let k = 3; k >= j; k--) {
                await this._rehashPart(j, k);
            }

            this._state.counter = (idx & mask) >>> 0;
        }

        await this._updateKeys();
    }

    /**
     * Encrypts the given data using the current key.
     * The encryption performed is AES-CBC, as specified by megolm.
     */
    async encrypt(data: Uint8Array): Promise<ArrayBuffer> {
        if (!this._keys) {
            await this._updateKeys();
        }

        return window.crypto.subtle.encrypt(
            {
                name: 'AES-CBC',
                iv: this._keys!.aesIv
            },
            this._keys!.aesKey,
            data);
    }

    /**
     * Decrypts the given data using the current key.
     */
    async decrypt(data: Uint8Array): Promise<ArrayBuffer> {
        if (!this._keys) {
            await this._updateKeys();
        }

        return window.crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: this._keys!.aesIv
            },
            this._keys!.aesKey,
            data);
    }

    /**
     * Computes the signature of the given data using HMAC SHA-256.
     */
    async sign(data: Uint8Array): Promise<ArrayBuffer> {
        if (!this._keys) {
            await this._updateKeys();
        }

        return window.crypto.subtle.sign('HMAC', this._keys!.macKey, data);
    }

    /**
     * Verfifies the given signature for the given data.
     */
    async verify(signature: Uint8Array, data: Uint8Array): Promise<boolean> {
        if (!this._keys) {
            await this._updateKeys();
        }

        return window.crypto.subtle.verify('HMAC', this._keys!.macKey, signature, data);
    }

    /**
     * Exports the current state to a format which Megolm.import can understand.
     */
    export(): string {
        // The format is similar to libolm's session sharing format.
        // +---+----+--------+--------+--------+--------+
        // | V | i  | R(i,0) | R(i,1) | R(i,2) | R(i,3) |
        // +---+----+--------+--------+--------+--------+
        // 0   1    5        37       69      101      133

        const bytes = new Uint8Array([
            XMEGOLM_EXPORT_VERSION,
            0, 0, 0, 0,
            ...this._state.data[0],
            ...this._state.data[1],
            ...this._state.data[2],
            ...this._state.data[3]
        ]);
        const view = new DataView(bytes.buffer);

        view.setUint32(1, this._state.counter);

        return base64js.fromByteArray(bytes);
    }

    /**
     * Returns the current ratchet state. This can be used to serialize and restore
     * it later.
     */
    getState(): RatchetState {
        return this._cloneState(this._state);
    }

    /**
     * Helper method to clone the current ratchet state.
     */
    private _cloneState(state: RatchetState): RatchetState {
        return {
            counter: state.counter,
            data: [
                new Uint8Array(state.data[0]),
                new Uint8Array(state.data[1]),
                new Uint8Array(state.data[2]),
                new Uint8Array(state.data[3])
            ]
        };
    }

    /**
     * Derives the AES key, AES IV and MAC key bits from the current ratchet
     * state.
     */
    private async _deriveBits(): Promise<ArrayBuffer> {
        const data = this._state.data;
        const bytes = new Uint8Array([ ...data[0], ...data[1], ...data[2], ...data[3] ]);

        // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
        const material = await window.crypto.subtle.importKey('raw', bytes,
            'HKDF', false, [ 'deriveBits' ]);

        // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits
        return window.crypto.subtle.deriveBits({
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(32),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            info: MEGOLM_INFO
        }, material, 640 /* (AES256_KEY_LENGTH + HMAC_KEY_LENGTH + AES256_IV_LENGTH) * 8 */);
    }

    /**
     * Internal helper used when advancing the ratchet.
     */
    private async _rehashPart(fromPart: number, toPart: number): Promise<void> {
        const keyBytes = this._state.data[fromPart];

        const material = await window.crypto.subtle.importKey(
            'raw',
            keyBytes,
            {
                name: 'HMAC',
                hash: 'SHA-256'
            },
            false,
            [ 'sign' ]
        );

        const result = await window.crypto.subtle.sign(
            'HMAC',
            material,
            HASH_KEY_SEEDS[toPart]);

        this._state.data[toPart] = new Uint8Array(result);
    }

    /**
     * Internal helper to update the keys by deriving them from the local ratchet state:
     * AES key (32 bytes), AES IV (16 bytes) and MAC key (32 bytes).
     */
    private async _updateKeys(): Promise<void> {
        const bits = await this._deriveBits();
        const bytes = new Uint8Array(bits);
        const aesKeyBytes = bytes.subarray(0, 32); // 32 bytes
        const macKeyBytes = bytes.subarray(32, 64); // 32 bytes
        const aesIv = bytes.subarray(64, 80); // 16 bytes

        const aesKey = await window.crypto.subtle.importKey(
            'raw',
            aesKeyBytes,
            'AES-CBC',
            false,
            [ 'encrypt', 'decrypt' ]
        );

        const macKey = await window.crypto.subtle.importKey(
            'raw',
            macKeyBytes,
            {
                name: 'HMAC',
                hash: 'SHA-256'
            },
            false,
            [ 'sign', 'verify' ]
        );

        this._keys = {
            aesKey,
            aesIv,
            macKey
        }
    }
}

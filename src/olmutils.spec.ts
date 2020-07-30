/* eslint-disable */

import base64js from 'base64-js';

import * as OlmUtils from './olmutils';

describe('olmutils', () => {
    it('decodes a message encoded using the libolm format', () => {
        const text = 'ciphertext';
        const data = new TextEncoder().encode(text);
        const payload = new Uint8Array([
            0x03,
            0x08, 0xc8, 0x01,
            0x12, data.length, ...data,
            ...new Uint8Array(8),
            ...new Uint8Array(64)
        ]);
        const message = base64js.fromByteArray(payload);
        const parsed = OlmUtils.parseGroupMessage(message);
        const decoded = OlmUtils.decodeGroupMessagePayload(parsed.payload);
        const decodedText = new TextDecoder().decode(decoded.ciphertext);

        expect(parsed.version).toEqual(0x03);
        expect(decoded.messageIndex).toEqual(200);
        expect(decoded.ciphertext).toEqual(data);
        expect(decodedText).toEqual(text);
    });
});

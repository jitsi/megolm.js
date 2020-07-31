/* eslint-disable */

import Olm from 'olm';

import { Megolm, OlmUtils } from './megolm';


function s2b(str) {
    return new TextEncoder().encode(str);
}

function flattenData(data) {
    return Uint8Array.from(data.reduce((a, b) => [...a, ...b], []));
}

const notSoRandomData = [
    s2b('0123456789ABCDEF0123456789ABCDEF'),
    s2b('0123456789ABCDEF0123456789ABCDEF'),
    s2b('0123456789ABCDEF0123456789ABCDEF'),
    s2b('0123456789ABCDEF0123456789ABCDEF')
];
const expected1 = new Uint8Array([
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
    0xba, 0x9c, 0xd9, 0x55, 0x74, 0x1d, 0x1c, 0x16, 0x23, 0x23, 0xec, 0x82, 0x5e, 0x7c, 0x5c, 0xe8,
    0x89, 0xbb, 0xb4, 0x23, 0xa1, 0x8f, 0x23, 0x82, 0x8f, 0xb2, 0x09, 0x0d, 0x6e, 0x2a, 0xf8, 0x6a
]);
const expected2 = new Uint8Array([
    0x54, 0x02, 0x2d, 0x7d, 0xc0, 0x29, 0x8e, 0x16, 0x37, 0xe2, 0x1c, 0x97, 0x15, 0x30, 0x92, 0xf9,
    0x33, 0xc0, 0x56, 0xff, 0x74, 0xfe, 0x1b, 0x92, 0x2d, 0x97, 0x1f, 0x24, 0x82, 0xc2, 0x85, 0x9c,
    0x70, 0x04, 0xc0, 0x1e, 0xe4, 0x9b, 0xd6, 0xef, 0xe0, 0x07, 0x35, 0x25, 0xaf, 0x9b, 0x16, 0x32,
    0xc5, 0xbe, 0x72, 0x6d, 0x12, 0x34, 0x9c, 0xc5, 0xbd, 0x47, 0x2b, 0xdc, 0x2d, 0xf6, 0x54, 0x0f,
    0x31, 0x12, 0x59, 0x11, 0x94, 0xfd, 0xa6, 0x17, 0xe5, 0x68, 0xc6, 0x83, 0x10, 0x1e, 0xae, 0xcd,
    0x7e, 0xdd, 0xd6, 0xde, 0x1f, 0xbc, 0x07, 0x67, 0xae, 0x34, 0xda, 0x1a, 0x09, 0xa5, 0x4e, 0xab,
    0xba, 0x9c, 0xd9, 0x55, 0x74, 0x1d, 0x1c, 0x16, 0x23, 0x23, 0xec, 0x82, 0x5e, 0x7c, 0x5c, 0xe8,
    0x89, 0xbb, 0xb4, 0x23, 0xa1, 0x8f, 0x23, 0x82, 0x8f, 0xb2, 0x09, 0x0d, 0x6e, 0x2a, 0xf8, 0x6a,
]);
const expected3 = new Uint8Array([
    0x54, 0x02, 0x2d, 0x7d, 0xc0, 0x29, 0x8e, 0x16, 0x37, 0xe2, 0x1c, 0x97, 0x15, 0x30, 0x92, 0xf9,
    0x33, 0xc0, 0x56, 0xff, 0x74, 0xfe, 0x1b, 0x92, 0x2d, 0x97, 0x1f, 0x24, 0x82, 0xc2, 0x85, 0x9c,
    0x55, 0x58, 0x8d, 0xf5, 0xb7, 0xa4, 0x88, 0x78, 0x42, 0x89, 0x27, 0x86, 0x81, 0x64, 0x58, 0x9f,
    0x36, 0x63, 0x44, 0x7b, 0x51, 0xed, 0xc3, 0x59, 0x5b, 0x03, 0x6c, 0xa6, 0x04, 0xc4, 0x6d, 0xcd,
    0x5c, 0x54, 0x85, 0x0b, 0xfa, 0x98, 0xa1, 0xfd, 0x79, 0xa9, 0xdf, 0x1c, 0xbe, 0x8f, 0xc5, 0x68,
    0x19, 0x37, 0xd3, 0x0c, 0x85, 0xc8, 0xc3, 0x1f, 0x7b, 0xb8, 0x28, 0x81, 0x6c, 0xf9, 0xff, 0x3b,
    0x95, 0x6c, 0xbf, 0x80, 0x7e, 0x65, 0x12, 0x6a, 0x49, 0x55, 0x8d, 0x45, 0xc8, 0x4a, 0x2e, 0x4c,
    0xd5, 0x6f, 0x03, 0xe2, 0x44, 0x16, 0xb9, 0x8e, 0x1c, 0xfd, 0x97, 0xc2, 0x06, 0xaa, 0x90, 0x7a
]);


describe('Megolm::advance', async () => {
    it('should produce the expected output when advancing once', async () => {
        const r = new Megolm({ counter: 0, data: notSoRandomData });

        await r.advance();
        
        const state1 = r.getState();
        const data1 = flattenData(state1.data);

        expect(state1.counter).toEqual(1);
        expect(data1).toEqual(expected1);
    });

    it('should produce the expected output when (complex) advanceing', async () => {
        const r = new Megolm({ counter: 0, data: notSoRandomData });

        await r.advanceTo(1);
        
        const state1 = r.getState();
        const data1 = flattenData(state1.data);

        expect(state1.counter).toEqual(1);
        expect(data1).toEqual(expected1);

        await r.advanceTo(0x1000000);

        const state2 = r.getState();
        const data2 = flattenData(state2.data);

        expect(state2.counter).toEqual(0x1000000);
        expect(data2).toEqual(expected2);

        await r.advanceTo(0x1041506);

        const state3 = r.getState();
        const data3 = flattenData(state3.data);

        expect(state3.counter).toEqual(0x1041506);
        expect(data3).toEqual(expected3);
    });
});

describe('Megolm::advance wraparound', async () => {
    it('should produce the expected output when advancing wraps', async () => {
        const r1 = new Megolm({ counter: 0xffffffff, data: notSoRandomData });

        await r1.advanceTo(0x1000000);

        const state11 = r1.getState();
        const data11 = flattenData(state11.data);

        expect(state11.counter).toEqual(0x1000000);

        const r2 = new Megolm({ counter: 0, data: notSoRandomData });

        await r2.advanceTo(0x2000000);

        const state21 = r2.getState();
        const data21 = flattenData(state21.data);

        expect(state21.counter).toEqual(0x2000000);

        expect(data11).toEqual(data21);
    });
});

describe('Megolm::advance overflow by one', async () => {
    it('should produce the expected output when advancing overflows by one', async () => {
        const r1 = new Megolm({ counter: 0xffffffff, data: notSoRandomData });

        await r1.advanceTo(0);

        const state11 = r1.getState();
        const data11 = flattenData(state11.data);

        expect(state11.counter).toEqual(0);

        const r2 = new Megolm({ counter: 0xffffffff, data: notSoRandomData });

        await r2.advanceTo(0);

        const state21 = r2.getState();
        const data21 = flattenData(state21.data);

        expect(state21.counter).toEqual(0);

        expect(data11).toEqual(data21);
    });
});

describe('Megolm::advance overflow', async () => {
    it('should produce the expected output when advancing overflows', async () => {
        const r1 = new Megolm({ counter: 1, data: notSoRandomData });

        await r1.advanceTo(0x80000000);
        await r1.advanceTo(0);

        const state11 = r1.getState();
        const data11 = flattenData(state11.data);

        expect(state11.counter).toEqual(0);

        const r2 = new Megolm({ counter: 1, data: notSoRandomData });

        await r2.advanceTo(0);

        const state21 = r2.getState();
        const data21 = flattenData(state21.data);

        expect(state21.counter).toEqual(0);

        expect(data11).toEqual(data21);
    });
});

describe('libolm interoperability:: ', async () => {
    it('should be possible to decrypt libolm encryptyed group messages', async () => {
        await Olm.init();

        const text = 'hello megolm!';
        const s = new Olm.OutboundGroupSession();
        s.create();
        const r = Megolm.fromSharedSession(s.session_key());

        // Advance the ratchet in the outbound group session a bit.
        for (let i = 0; i < 200; i++) {
            s.encrypt('');
        }

        const cipherText = s.encrypt(text)
        const parsed = OlmUtils.parseGroupMessage(cipherText);
        const decoded = OlmUtils.decodeGroupMessagePayload(parsed.payload);

        expect(parsed.version).toEqual(0x03);
        expect(decoded.messageIndex).toEqual(200);

        await r.advanceTo(decoded.messageIndex);

        // The MAC is computed from everything before it, that is the version + payload.
        const macInput = new Uint8Array([parsed.version, ...parsed.payload]);
        const macResult = new Uint8Array(await r.sign(macInput));

        expect(parsed.mac).toEqual(macResult.subarray(0, parsed.mac.length));

        const verifiedMac = await r.verify(macResult, macInput);

        expect(verifiedMac).toBeTrue();

        // Now comes the big one, decrypt it using our key.
        const result = await r.decrypt(decoded.ciphertext);
        const resultStr = new TextDecoder().decode(new Uint8Array(result));

        expect(resultStr).toEqual(text);
    });

    it('encrypting should yield the same payload', async () => {
        await Olm.init();

        const text = 'hello megolm!';
        const s = new Olm.OutboundGroupSession();
        s.create();
        const r = Megolm.fromSharedSession(s.session_key());

        // Advance the ratchet in the outbound group session.
        for (let i = 0; i < 200; i++) {
            s.encrypt('');
        }

        const cipherText = s.encrypt(text)
        const parsed = OlmUtils.parseGroupMessage(cipherText);
        const decoded = OlmUtils.decodeGroupMessagePayload(parsed.payload);

        expect(parsed.version).toEqual(0x03);
        expect(decoded.messageIndex).toEqual(200);

        await r.advanceTo(decoded.messageIndex);

        const result = await r.encrypt(new TextEncoder().encode(text));

        expect(new Uint8Array(result)).toEqual(decoded.ciphertext);
    });
});

describe('Import / export functionality', async () => {
    it('should be possible to export and then import a ratchet', async () => {
        const r1 = new Megolm();

        await r1.advanceTo(123);

        const r1State = r1.getState();

        expect(r1State.counter).toEqual(123);

        const r2 = Megolm.import(r1.export());
        const r2State = r2.getState();

        expect(r2State.counter).toEqual(123);

        expect(flattenData(r1State.data)).toEqual(flattenData(r2State.data));
    });
});

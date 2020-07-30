import base64js from 'base64-js';
import varint from 'varint';

const GROUP_MESSAGE_INDEX_TAG = 0x08;
const GROUP_CIPHERTEXT_TAG = 0x12;
const MAC_LENGTH = 8;
const SIGNATURE_LENGTH = 64;

interface ParsedMessage {
    version: number,
    payload: Uint8Array,
    mac: Uint8Array,
    signature: Uint8Array
}

interface DecodedMessage {
    ciphertext: Uint8Array,
    messageIndex: number,
}

/**
 * Parses a libolm generated group message and extracts its fields.
 */
export function parseGroupMessage(message: string): ParsedMessage {
    // 1. base64 decode

    const adjustedSize = Math.round(message.length / 4) * 4; // Must be a multiple of 4.
    const bytes = Uint8Array.from(base64js.toByteArray(message.padEnd(adjustedSize, '=')));

    // libolm group message format
    // https://gitlab.matrix.org/matrix-org/olm/-/blob/master/docs/megolm.md#message-format
    // +---+------------------------------------+-----------+------------------+
    // | V | Payload Bytes                      | MAC Bytes | Signature Bytes  |
    // +---+------------------------------------+-----------+------------------+
    // 0   1                                    N          N+8                N+72   bytes

    // 2. validate version

    const version = bytes[0];

    // 3. extract fields

    const trailerLength = MAC_LENGTH + SIGNATURE_LENGTH;
    const payload = bytes.subarray(1, -trailerLength);
    const signature = bytes.subarray(-SIGNATURE_LENGTH);
    const mac = bytes.subarray(-trailerLength).subarray(0, MAC_LENGTH);

    return {
        version,
        payload,
        mac,
        signature
    };
}

/**
 * Decodes the payload contained in a libolm generated group message.
 * (libolm uses some custom ProtoBuf inspired encoding)
 */
export function decodeGroupMessagePayload(payload: Uint8Array): DecodedMessage {
    if (payload.length === 0) {
        throw new Error('Empty payload!');
    }

    let pos = 0;
    const end = payload.length - 1;

    let messageIndex;
    let ciphertext;

    while (pos <= end) {
        if (payload[pos] === GROUP_MESSAGE_INDEX_TAG) {
            pos++;
            messageIndex = varint.decode(payload.subarray(pos));
            pos += varint.decode.bytes;
        } else if (payload[pos] === GROUP_CIPHERTEXT_TAG) {
            pos++;
            const len = varint.decode(payload.subarray(pos));

            pos += varint.decode.bytes;

            ciphertext = payload.slice(pos, pos + len);

            pos += len;
        } else {
            pos++;
        }
    }

    if (messageIndex === undefined || ciphertext === undefined) {
        throw new Error('Invalid message: message index or ciphertext are missing');
    }

    return {
        ciphertext,
        messageIndex
    }
}

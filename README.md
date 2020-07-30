# megolm.js

Megolm.js is an implementation of the [megolm cryptographic ratchet] in JavaScript.

## Overview and motivation

Megolm is the current cryptographic ratchet used by [libolm] for group chat sessions.

Its security features and limitations can be found [here].

This library exists because we wanted to use a ratchet with the same properties as megolm,
but libolm currently ties its use to group chat messages. There are other use cases,
however.

This implementation is a port of [the C implementation] without too many bells and whistles
in order to make checking its correctness easier.

[megolm cryptographic ratchet]: https://gitlab.matrix.org/matrix-org/olm/-/blob/master/docs/megolm.md
[libolm]: https://gitlab.matrix.org/matrix-org/olm
[here]: https://gitlab.matrix.org/matrix-org/olm/-/blob/master/docs/megolm.md#limitations
[the C implementation]: https://gitlab.matrix.org/matrix-org/olm/-/blob/master/src/megolm.c

## API

```
declare type RatchetData = Array<Uint8Array>;

interface RatchetState {
    counter: number;
    data: RatchetData;
}

/**
 * Megolm.js is a JavaScript implementation of the Megolm cryptographic ratchet.
 * It is intended to be used standalone, but it's interoperable with libolm's
 * implementation.
 */
export declare class Megolm {
    /**
     * Builds a Megolm object from the shared session format used by libolm's
     * OutgoingSession.session_key() method.
     */
    static fromSharedSession(sessionKey: string): Megolm;
    /**
     * Builds a new Megolm instance. The given initial state can be used to restore
     * a previously saved ratchet state.
     */
    constructor(initialState?: RatchetState);
    /**
     * Advances the ratched by one step.
     */
    advance(): Promise<void>;
    /**
     * Advances the ratchet the given number of steps.
     */
    advanceTo(idx: number): Promise<void>;
    /**
     * Encrypts the given data using the current key.
     * The encryption performed is AES-CBC, as specified by megolm.
     */
    encrypt(data: Uint8Array): Promise<ArrayBuffer>;
    /**
     * Decrypts the given data using the current key.
     */
    decrypt(data: Uint8Array): Promise<ArrayBuffer>;
    /**
     * Computes the signature of the given data using HMAC SHA-256.
     */
    sign(data: Uint8Array): Promise<ArrayBuffer>;
    /**
     * Verfifies the given signature for the given data.
     */
    verify(signature: Uint8Array, data: Uint8Array): Promise<boolean>;
    /**
     * Returns the current ratchet state. This can be used to serialize and restore
     * it later.
     */
    getState(): RatchetState;
}
```

## Acknowledgements

The Matrix team, for writing libolm and megolm in the first place.

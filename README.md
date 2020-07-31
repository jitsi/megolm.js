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

See [API.md](API.md).

### Extensions

The `import` and `export` methods are extensions to the original implementation,
inspired by libolm's session sharing.

## Acknowledgements

The Matrix team, for writing libolm and megolm in the first place.

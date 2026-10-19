import { z } from 'zod';

// A timestamp as the two apps see it: the wire carries an ISO 8601 string with an
// offset (`z.input`, what the web imports), the API handles a `Date` (`z.output`,
// what a service return is annotated with). One codec, both sides inferred from
// it. JSON Schema emission must use `io: 'input'` — `Date` has no JSON
// representation.
export const isoDateTime = z.codec(z.iso.datetime({ offset: true }), z.date(), {
  decode: (iso) => new Date(iso),
  encode: (date) => date.toISOString(),
});

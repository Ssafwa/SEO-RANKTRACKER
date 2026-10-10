import { timingSafeEqual } from 'node:crypto';

export function isValidCronAuthorization(authorization, secret) {
    if (!secret || typeof authorization !== 'string') return false;

    const expected = Buffer.from(`Bearer ${secret}`);
    const actual = Buffer.from(authorization);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

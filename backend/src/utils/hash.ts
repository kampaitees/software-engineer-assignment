import crypto from 'node:crypto'
export function sha256(value: string) { return crypto.createHash('sha256').update(value).digest('hex') }
export function normalize(value: string) { return value.trim().replace(/\s+/g, ' ').toLowerCase() }

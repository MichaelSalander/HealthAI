import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const COST = 16384
const BLOCK_SIZE = 8
const PARALLELIZATION = 1
const KEY_LENGTH = 32

export function hashPassword(password) {
  const salt = randomBytes(16)
  const digest = scryptSync(String(password), salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION })
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString('base64url')}$${digest.toString('base64url')}`
}

export function verifyPassword(password, encoded) {
  const parts = String(encoded || '').split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, saltText, digestText] = parts
  const salt = Buffer.from(saltText, 'base64url')
  const expected = Buffer.from(digestText, 'base64url')
  if (!salt.length || expected.length !== KEY_LENGTH) return false
  const actual = scryptSync(String(password), salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) })
  return timingSafeEqual(actual, expected)
}

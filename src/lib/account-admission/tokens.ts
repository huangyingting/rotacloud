import { createHash, randomBytes } from 'node:crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function createInvitationCode(): string {
  const bytes = randomBytes(12);
  let chars = '';
  for (let i = 0; i < 12; i += 1) {
    chars += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `RC-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function normalizeInvitationToken(token: string): string {
  return token.trim().toUpperCase();
}

export function hashOpaqueToken(token: string): string {
  const normalized = normalizeInvitationToken(token);
  return createHash('sha256').update(normalized, 'utf8').digest('base64url');
}

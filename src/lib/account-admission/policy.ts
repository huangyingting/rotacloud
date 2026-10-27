export const ACCOUNT_ADMISSION_MODES = ['invitation-only'] as const;
export type AccountAdmissionMode = (typeof ACCOUNT_ADMISSION_MODES)[number];

export const VALID_RBAC_ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const;
export type RbacRole = (typeof VALID_RBAC_ROLES)[number];

export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAccountEmail(email: string): boolean {
  const normalized = normalizeAccountEmail(email);
  const separator = normalized.indexOf('@');
  return (
    normalized.length <= 320 &&
    separator > 0 &&
    separator === normalized.lastIndexOf('@') &&
    separator < normalized.length - 1 &&
    !/\s/.test(normalized)
  );
}

export function normalizeRbacRole(role?: string | null): RbacRole {
  const upper = (role || 'EMPLOYEE').trim().toUpperCase();
  if (upper === 'ADMIN' || upper === 'MANAGER' || upper === 'EMPLOYEE') {
    return upper;
  }
  return 'EMPLOYEE';
}

export function accountAdmissionMode(): AccountAdmissionMode {
  return 'invitation-only';
}

export function accountAdmissionPublicOrigin(requestUrl?: string): string {
  const envOrigin =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;
  if (envOrigin) {
    const url = new URL(envOrigin);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Configure a valid application origin.');
    }
    return url.origin;
  }
  if (requestUrl) {
    return new URL(requestUrl).origin;
  }
  return 'http://localhost:3000';
}

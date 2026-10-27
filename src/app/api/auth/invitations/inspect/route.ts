import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { inspectAccountInvitation } from '@/lib/account-admission/invitations';

export const GET = api(async (request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || url.searchParams.get('token') || '';
  const view = await inspectAccountInvitation(code);
  return NextResponse.json({ invitation: view });
});

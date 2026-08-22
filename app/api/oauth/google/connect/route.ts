/* ==============================================================================
   BLOCK COMMENT: SECURE GOOGLE OAUTH CONNECT ROUTE WITH SIGNED STATE
   Generates HMAC-signed state preventing CSRF attacks.
   ============================================================================== */
import { NextResponse } from 'next/server';
import { generateSignedOAuthState } from '@/lib/oauth_state';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const workflow_id = searchParams.get('workflow_id') || '';
  const node_id = searchParams.get('node_id') || '';
  const client_id = searchParams.get('client_id') || process.env.GOOGLE_CLIENT_ID || '';

  if (!workflow_id || !node_id || !client_id) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const state = generateSignedOAuthState(workflow_id, node_id);

  const newParams = new URLSearchParams({
    client_id: client_id,
    redirect_uri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/google/callback`,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'].join(' '),
    state: state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${newParams.toString()}`,
  );
}

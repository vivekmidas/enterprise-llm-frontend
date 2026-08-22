/* ==============================================================================
   BLOCK COMMENT: HARDENED GENERIC OAUTH CALLBACK (XSS & CSRF MITIGATION)
   ============================================================================== */
import { NextRequest, NextResponse } from 'next/server';
import { verifySignedOAuthState } from '@/lib/oauth_state';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const statePayload = verifySignedOAuthState(state);
  if (!statePayload) {
    return NextResponse.json(
      { error: 'Invalid or expired OAuth state parameter' },
      { status: 403 },
    );
  }

  const { workflow_id, node_id } = statePayload;

  try {
    // 1. Exchange the authorization code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      throw new Error(tokens.error_description || tokens.error || 'Failed to exchange token');
    }

    // 2. Send tokens to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const cookieHeader = request.headers.get('cookie') || '';
    const backendRes = await fetch(`${backendUrl}/workflows/refresh-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        workflow_id,
        node_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }),
    });

    if (!backendRes.ok) {
      const errorMsg = await backendRes.text();
      throw new Error(`Backend storage failed: ${errorMsg}`);
    }

    // 3. Return sanitized HTML with strict postMessage target origin
    const postPayload = JSON.stringify({
      type: 'AUTH_SUCCESS',
      workflow_id,
      node_id,
    });
    const targetOrigin = JSON.stringify(process.env.NEXT_PUBLIC_APP_URL || '');

    return new NextResponse(
      `<!DOCTYPE html>
<html>
  <head><title>Authentication Successful</title></head>
  <body>
    <script>
      (function() {
        var payload = ${postPayload};
        var targetOrigin = ${targetOrigin} || window.location.origin;
        if (window.opener) {
          window.opener.postMessage(payload, targetOrigin);
        }
        window.close();
      })();
    </script>
  </body>
</html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}

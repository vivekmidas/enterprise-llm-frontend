import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const provider = 'google';
  const { searchParams } = new URL(request.url);
  const client_id = searchParams.get('client_id');
  const client_secret = searchParams.get('client_secret');
  const workflow_id = searchParams.get('workflow_id');
  const node_id = searchParams.get('node_id');
  console.log(client_id, client_secret, workflow_id, node_id);
  if (!client_id || !client_secret || !workflow_id || !node_id) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // 1. Fetch provider details from backend to get auth_url and scopes
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  let providerConfig;
  try {
    const providersRes = await fetch(`${backendUrl}/admin/auth/providers`);
    if (!providersRes.ok) throw new Error();
    const providers = await providersRes.json();
    providerConfig = providers.find((p: any) => p.name === provider);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch provider config' }, { status: 500 });
  }

  if (!providerConfig) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  // 2. Build the state. Encapsulate context for the callback.
  const state = `${workflow_id}|${node_id}|${client_id}|${client_secret}`;

  // 3. Construct the Provider Auth URL
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;

  const authUrl = new URL(providerConfig.auth_url);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', client_id);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', providerConfig.default_scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}

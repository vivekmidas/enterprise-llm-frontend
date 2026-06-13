import { NextResponse, NextRequest } from "next/server";

export async function GET( request: NextRequest,
  { params }: { params: { provider: string } }) {
  
  const { searchParams } = new URL(request.url);
  const workflow_id = searchParams.get('workflow_id')||"";
  const node_id = searchParams.get('node_id')||"";
  const client_id = searchParams.get('client_id')||"";
   const client_secret = searchParams.get('client_secret')||"";

  if (!workflow_id || !node_id || !client_id) {
    console.log(workflow_id, node_id, client_id);
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const state = `${workflow_id}|${node_id}`;

  const newParams = new URLSearchParams({
   // client_id: process.env.GOOGLE_CLIENT_ID!,
    client_id: client_id,
    //client_secret:client_secret,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
    ].join(" "),
    state: state,
  });



  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${newParams.toString()}`
  );
}
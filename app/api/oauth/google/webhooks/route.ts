/* ==============================================================================
   BLOCK COMMENT: AUTHENTICATED GMAIL PUBSUB WEBHOOK ENDPOINT
   Validates subscription verification token and message schema before processing.
   ============================================================================== */
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || request.headers.get('x-goog-channel-token');
    const expectedToken = process.env.PUBSUB_VERIFICATION_TOKEN || process.env.GMAIL_WEBHOOK_SECRET;

    // Verify webhook authenticity if verification token is configured
    if (expectedToken && token !== expectedToken) {
      console.warn('⚠️ Unauthorized Gmail webhook attempt detected');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.message || !body.message.data) {
      return new Response('Bad Request: Invalid Pub/Sub message payload', { status: 400 });
    }

    // Safely decode message data
    const messageData = body.message.data;
    let notification: any;
    try {
      const decodedData = Buffer.from(messageData, 'base64').toString('utf-8');
      notification = JSON.parse(decodedData);
    } catch {
      return new Response('Bad Request: Invalid Base64/JSON encoding', { status: 400 });
    }

    if (!notification || typeof notification !== 'object') {
      return new Response('Bad Request: Empty notification content', { status: 400 });
    }

    console.log('📧 Validated Gmail Notification received for:', notification.emailAddress);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Error processing Gmail webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Handle GET for healthcheck
export async function GET() {
  return new Response('Gmail Webhook Endpoint is active', { status: 200 });
}

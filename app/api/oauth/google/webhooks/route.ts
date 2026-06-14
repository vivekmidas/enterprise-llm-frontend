import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("📧 Gmail Push Notification Received:");
    console.log(JSON.stringify(body, null, 2));

    // Handle Pub/Sub push format
    if (body.message?.data) {
      const messageData = body.message.data;
      const decodedData = Buffer.from(messageData, 'base64').toString();
      const notification = JSON.parse(decodedData);

      console.log("✅ Decoded Gmail Notification:", notification);

      // notification contains:
      // {
      //   "historyId": 123456789,
      //   "emailAddress": "user@gmail.com"
      // }

      // TODO: Call your function to process new emails
      // await processGmailChanges(notification.emailAddress, notification.historyId);
    }

    // Always return 200 OK quickly (important!)
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("❌ Error processing Gmail webhook:", error);
    // Still return 200 so Pub/Sub doesn't retry excessively
    return new Response("OK", { status: 200 });
  }
}

// Optional: Handle GET for testing
export async function GET() {
  return new Response("Gmail Webhook is active ✅", { status: 200 });
}
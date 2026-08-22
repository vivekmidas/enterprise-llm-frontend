/* ==============================================================================
   BLOCK COMMENT: SECURE OAUTH STATE SIGNING & VERIFICATION HELPER
   Prevents OAuth CSRF, session fixation, and state tampering via HMAC-SHA256.
   ============================================================================== */
import crypto from 'crypto';

const OAUTH_SECRET = process.env.AUTH_SECRET || process.env.SECRET_KEY || 'default-oauth-secure-secret-key-salt';

export interface OAuthStatePayload {
  workflow_id: string;
  node_id: string;
  timestamp: number;
  nonce: string;
}

export function generateSignedOAuthState(workflowId: string, nodeId: string): string {
  const payload: OAuthStatePayload = {
    workflow_id: workflowId,
    node_id: nodeId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', OAUTH_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

export function verifySignedOAuthState(state: string, maxAgeMs: number = 15 * 60 * 1000): OAuthStatePayload | null {
  if (!state || !state.includes('.')) {
    // Handle fallback for legacy format workflow_id|node_id if needed, or reject
    const parts = state.split('|');
    if (parts.length === 2 && parts[0] && parts[1]) {
      return {
        workflow_id: parts[0],
        node_id: parts[1],
        timestamp: Date.now(),
        nonce: 'legacy',
      };
    }
    return null;
  }

  const [payloadStr, signature] = state.split('.');
  if (!payloadStr || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', OAUTH_SECRET)
    .update(payloadStr)
    .digest('base64url');

  // Constant-time buffer comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadStr, 'base64url').toString('utf-8');
    const payload: OAuthStatePayload = JSON.parse(payloadJson);

    // Check expiration (default 15 minutes)
    if (Date.now() - payload.timestamp > maxAgeMs) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

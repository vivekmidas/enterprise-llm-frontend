import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/audit/logs
 * Get audit logs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/audit/logs?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization') || '',
        }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Audit logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit/logs
 * Log an audit action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/audit/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization') || '',
        }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[v0] Audit log creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/queries
 * Get saved queries for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/queries?${searchParams}`, {
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
    console.error('[v0] Queries API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/queries
 * Save a new query
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/queries`, {
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
    console.error('[v0] Save query API error:', error);
    return NextResponse.json(
      { error: 'Failed to save query' },
      { status: 500 }
    );
  }
}

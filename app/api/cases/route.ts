import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cases
 * Get all cases with optional filters (admin view)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/cases?${searchParams}`, {
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
    console.error('[v0] Cases API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

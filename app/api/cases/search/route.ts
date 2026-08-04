import { NextRequest, NextResponse } from 'next/server';
import apiClient, { handleApiError } from '@/lib/api/client';

/**
 * POST /api/cases/search
 * Proxy search requests to the backend API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/cases/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth headers if present
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search cases' },
      { status: 500 }
    );
  }
}

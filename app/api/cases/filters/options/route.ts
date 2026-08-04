import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cases/filters/options
 * Get available filter options (judges, courts, locations, articles)
 */
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/cases/filters/options`, {
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
    console.error('[v0] Filter options API error:', error);
    // Return mock data as fallback
    return NextResponse.json({
      judges: ['Judge Smith', 'Judge Johnson', 'Judge Williams', 'Judge Brown'],
      courts: ['Supreme Court', 'High Court', 'District Court', 'Civil Court'],
      locations: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
      articles: ['Sec_122(1A)', 'Sec_212(B)', 'Art_15', 'Art_32', 'Rule_101'],
    });
  }
}

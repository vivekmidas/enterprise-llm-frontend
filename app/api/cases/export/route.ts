import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/cases/export
 * Export cases to PDF/CSV/JSON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { case_ids, format, query_context } = body;

    if (!case_ids || case_ids.length === 0) {
      return NextResponse.json(
        { error: 'No cases specified for export' },
        { status: 400 }
      );
    }

    if (!['pdf', 'csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/cases/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization') || '',
        }),
      },
      body: JSON.stringify({ case_ids, format, query_context }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="cases_export.${format}"`
    );

    return new NextResponse(blob, { headers, status: 200 });
  } catch (error) {
    console.error('[v0] Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export cases' },
      { status: 500 }
    );
  }
}

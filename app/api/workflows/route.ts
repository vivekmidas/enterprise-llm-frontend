import { NextRequest, NextResponse } from 'next/server';

const workflows = new Map(); // In-memory for now (later → DB)

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  const workflow = workflows.get(id) || {
    id: "default",
    nodes: [
      { id: "presidio", type: "agent", name: "presidio_ner_guard" },
      { id: "profanity", type: "agent", name: "profanity_guard" },
      { id: "llm", type: "llm" }
    ],
    edges: []
  };

  return NextResponse.json(workflow);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  workflows.set(body.id, body);
  return NextResponse.json({ success: true, workflow: body });
}

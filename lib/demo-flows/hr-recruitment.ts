/**
 * HR / ATS Demo Flow
 *
 * Uses ONLY existing registered nodes — no new Python classes except ats_vectordb_ingest.
 *
 * Node map:
 *  api_webhook_agent   → ATS Trigger  (base_path="ats", JWT auth)
 *  gemini_node         → CV Extractor  (system_prompt = extraction prompt)
 *  gemini_node         → CV Tagger     (system_prompt = metadata JSON prompt)
 *  ats_vectordb_ingest → VectorDB Ingest (wraps KnowledgeIngestionService)
 *  knowledge_retrieval → Profile Search  (KB = ats-cv-pool, top_k=10)
 *  gemini_node         → Ranker LLM    (system_prompt = ranking + summary prompt)
 *  transformer_node    → Response Builder (mapping_template Jinja)
 *
 * Two paths split by edge condition off the trigger:
 *   condition="ingest"  → CV Extractor → CV Tagger → VectorDB Ingest → Ingest Confirmation
 *   condition="search"  → Profile Search → Ranker LLM → Response Builder
 */

import type { Node, Edge } from '@xyflow/react';

export const HR_FLOW_ID   = 'demo-hr-recruitment';
export const HR_FLOW_NAME = 'ATS — AI Talent Pipeline';
export const HR_FLOW_DESCRIPTION =
  'Webhook-driven ATS: CV ingest (PDF→VectorDB with metadata tags) and ' +
  'semantic candidate search by position. Two paths on one workflow — ingest and search.';
export const HR_FLOW_CATEGORY = 'HR';

// ─────────────────────────────────────────────────────────────────────────────
// Node positions
// ─────────────────────────────────────────────────────────────────────────────
//
//  [ATS Trigger]
//        │
//   ─────┴──────────────────────────────────────────────────────
//   │ (ingest)                                (search) │
//   ▼                                                  ▼
//  [CV Extractor LLM]                    [Knowledge Retrieval]
//        │                                         │
//        ▼                                         ▼
//  [CV Tagger LLM]                         [Ranker LLM]
//        │                                         │
//        ▼                                         ▼
//  [VectorDB Ingest]                     [Response Builder]
//        │
//        ▼
//  [Ingest Confirmation]

const X_TRIGGER    = 60;
const X_INGEST     = 60;
const X_SEARCH     = 640;

const Y_TRIGGER    = 280;
const Y_STEP1      = 460;
const Y_STEP2      = 640;
const Y_STEP3      = 820;
const Y_STEP4      = 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Nodes — all use existing registered node names
// ─────────────────────────────────────────────────────────────────────────────
export const hrNodes: Node[] = [
  // ── Trigger ───────────────────────────────────────────────────────────────
  {
    id: 'ats-trigger',
    type: 'NODE',
    position: { x: X_TRIGGER + 290, y: Y_TRIGGER },
    data: {
      // Maps to registered node: api_webhook_agent
      name: 'api_webhook_agent',
      label: 'ATS Webhook (/ats)',
      description:
        'Webhook trigger at /webhooks/run/ats. Accepts CV ingest (mode=ingest) or ' +
        'candidate search (mode=search) requests via JSON body. JWT-secured.',
      node_type: 'trigger',
      category: 'Trigger',
      group: 'Trigger',
      icon: 'webhook',
      color: '#3b82f6',
      badge: 'Trigger',
      // Workflow-instance properties override the base node's defaults
      user_properties: {},
      system_properties: {
        base_path: 'ats',   // → /webhooks/run/ats
      },
      // Input contract for this ATS instance
      input_contract: {
        mode:             { type: 'string',  required: true,  enum: ['ingest', 'search', 'ingest_email'] },
        // ingest fields
        applicant_name:   { type: 'string',  required: false },
        email:            { type: 'string',  required: false },
        position_applied: { type: 'string',  required: false },
        experience_years: { type: 'number',  required: false },
        source:           { type: 'string',  required: false },
        cv_file_b64:      { type: 'string',  required: false, description: 'Base64 PDF/DOCX bytes' },
        cv_url:           { type: 'string',  required: false },
        // search fields
        query_text:       { type: 'string',  required: false },
        jd_file_b64:      { type: 'string',  required: false },
        position:         { type: 'string',  required: false },
        top_k:            { type: 'integer', required: false },
        min_score:        { type: 'number',  required: false },
        filters:          { type: 'object',  required: false },
        // email ingest
        raw_email:        { type: 'string',  required: false },
        from_address:     { type: 'string',  required: false },
        subject:          { type: 'string',  required: false },
      },
      output_contract: {
        // Passes body through unchanged — downstream nodes access fields directly
        data: { type: 'object', required: true },
      },
      executionStatus: 'idle',
    },
  },

  // ── INGEST PATH ───────────────────────────────────────────────────────────

  // Step I-1: CV Text Extractor — gemini_node configured with extraction prompt
  {
    id: 'ats-cv-extractor',
    type: 'agentNode',
    position: { x: X_INGEST, y: Y_STEP1 },
    data: {
      name: 'gemini_node',
      label: 'CV Text Extractor',
      description:
        'Extracts clean text from an uploaded CV PDF/DOCX (base64). ' +
        'Returns the raw readable content for downstream tagging.',
      node_type: 'Node',
      category: 'LLM',
      group: 'LLM',
      icon: 'bot',
      color: '#8b5cf6',
      badge: 'LLM',
      user_properties: {
        system_prompt:
          'You are a document extraction assistant. ' +
          'The user will provide a base64-encoded PDF or plain text CV. ' +
          'Extract and return ONLY the raw readable text from the document. ' +
          'Preserve structure (sections, bullet points) but strip all formatting. ' +
          'Do not summarise, analyse, or add any commentary.',
        temperature: 0.0,
        max_tokens: 4096,
      },
      input_contract: {
        cv_file_b64:     { type: 'string', required: false, description: 'Base64 PDF/DOCX' },
        mime_type:       { type: 'string', required: false },
        applicant_name:  { type: 'string', required: false },
      },
      output_contract: {
        text: { type: 'string', required: true, description: 'Raw extracted CV text' },
      },
      executionStatus: 'idle',
    },
  },

  // Step I-2: CV Metadata Tagger — gemini_node with structured JSON extraction prompt
  {
    id: 'ats-cv-tagger',
    type: 'agentNode',
    position: { x: X_INGEST, y: Y_STEP2 },
    data: {
      name: 'gemini_node',
      label: 'CV Metadata Tagger',
      description:
        'Extracts structured metadata from CV text: skills, experience, position, education, ' +
        'certifications, location, LinkedIn. Output is a JSON object used as VectorDB tags.',
      node_type: 'Node',
      category: 'LLM',
      group: 'LLM',
      icon: 'bot',
      color: '#8b5cf6',
      badge: 'LLM',
      user_properties: {
        system_prompt:
          'You are an HR data extraction assistant. Extract the following fields from the CV text ' +
          'and return ONLY a valid JSON object — no markdown, no explanation:\n' +
          '{\n' +
          '  "applicant_name": string,\n' +
          '  "email": string,\n' +
          '  "phone": string,\n' +
          '  "current_position": string,\n' +
          '  "current_company": string,\n' +
          '  "experience_years": integer,\n' +
          '  "skills": [string],\n' +
          '  "education": string,\n' +
          '  "certifications": [string],\n' +
          '  "languages": [string],\n' +
          '  "location": string,\n' +
          '  "linkedin": string,\n' +
          '  "summary": string,\n' +
          '  "doc_type": "cv"\n' +
          '}\n' +
          'Use empty string or [] for missing fields. Never invent data.',
        temperature: 0.0,
        max_tokens: 1024,
      },
      input_contract: {
        text: { type: 'string', required: true, description: 'Raw CV text from extractor' },
      },
      output_contract: {
        text: { type: 'string', required: true, description: 'JSON metadata object as string' },
      },
      executionStatus: 'idle',
    },
  },

  // Step I-3: VectorDB Ingest — generic_llm_vector_db, operation=upsert
  {
    id: 'ats-vectordb-ingest',
    type: 'agentNode',
    position: { x: X_INGEST, y: Y_STEP3 },
    data: {
      name: 'generic_llm_vector_db',
      label: 'VectorDB Ingest',
      description:
        'Embeds CV text and upserts chunks into the ATS Qdrant collection with metadata tags ' +
        '(skills, experience_years, position_applied, email, doc_type=cv).',
      node_type: 'Node',
      category: 'Vector Databases',
      group: 'Vector Databases',
      icon: 'database',
      color: '#2cb23c',
      badge: 'VectorDB',
      user_properties: {
        operation:         'upsert',
        db_type:           'qdrant',
        url:               '',           // Set at workflow config time (Qdrant URL)
        collection_name:   'ats_cv_pool',
        embedding_api_url: '',           // Set at workflow config time
        embedding_model:   'nomic-embed-text',
        embedding_api_key: '',
        chunking_strategy: 'recursive',
        chunk_size:        800,
        chunk_overlap:     150,
      },
      // Runtime payload keys (from upstream gemini_node output via transformer)
      input_contract: {
        text:       { type: 'string', required: false, description: 'Raw CV text to embed' },
        pdf_base64: { type: 'string', required: false, description: 'Base64 PDF bytes' },
      },
      output_contract: {
        status:          { type: 'string',  required: true  },
        upserted_points: { type: 'integer', required: false },
      },
      executionStatus: 'idle',
    },
  },

  // Step I-4: Ingest Confirmation — transformer_node formats the confirmation response
  {
    id: 'ats-ingest-confirm',
    type: 'agentNode',
    position: { x: X_INGEST, y: Y_STEP4 },
    data: {
      name: 'transformer_node',
      label: 'Ingest Confirmation',
      description:
        'Formats the VectorDB ingest result into a structured API response ' +
        'confirming the CV was stored with its document_id and chunk count.',
      node_type: 'Node',
      category: 'Data',
      group: 'Data',
      icon: 'check-circle',
      color: '#10b981',
      badge: 'Transform',
      user_properties: {
        mapping_template: JSON.stringify({
          status:         '{{ input_data.status }}',
          message:        '{{ input_data.message }}',
          document_id:    '{{ input_data.document_id }}',
          applicant_name: '{{ input_data.applicant_name }}',
          email:          '{{ input_data.email }}',
          chunks_indexed: '{{ input_data.chunk_count }}',
        }),
        output_format: 'json',
      },
      executionStatus: 'idle',
    },
  },

  // ── SEARCH PATH ───────────────────────────────────────────────────────────

  // Step S-1: Candidate Search — generic_llm_vector_db, operation=search
  {
    id: 'ats-search',
    type: 'agentNode',
    position: { x: X_SEARCH, y: Y_STEP1 },
    data: {
      name: 'generic_llm_vector_db',
      label: 'Candidate Search',
      description:
        'Embeds the job description query and performs similarity search against the ATS Qdrant collection. ' +
        'Returns top_k candidate profile chunks ranked by cosine similarity.',
      node_type: 'Node',
      category: 'Vector Databases',
      group: 'Vector Databases',
      icon: 'search',
      color: '#2cb23c',
      badge: 'VectorDB',
      user_properties: {
        operation:         'search',
        db_type:           'qdrant',
        url:               '',           // Set at workflow config time
        collection_name:   'ats_cv_pool',
        embedding_api_url: '',           // Set at workflow config time
        embedding_model:   'nomic-embed-text',
        embedding_api_key: '',
        similarity_threshold: 0.55,
        top_k:             10,
      },
      // Runtime payload: { text: <query> } or { query: <query> }
      input_contract: {
        text:  { type: 'string', required: false, description: 'Job description or keyword query' },
        query: { type: 'string', required: false, description: 'Alias for text' },
      },
      output_contract: {
        results: { type: 'array',  required: true  },
        count:   { type: 'integer',required: false },
      },
      executionStatus: 'idle',
    },
  },

  // Step S-2: Ranker + Summary LLM — gemini_node with ranking prompt
  {
    id: 'ats-ranker',
    type: 'agentNode',
    position: { x: X_SEARCH, y: Y_STEP2 },
    data: {
      name: 'gemini_node',
      label: 'Candidate Ranker',
      description:
        'Ranks retrieved candidates against the job description. ' +
        'Produces per-candidate score, match summary, skill gaps, and recommendation.',
      node_type: 'Node',
      category: 'LLM',
      group: 'LLM',
      icon: 'bot',
      color: '#8b5cf6',
      badge: 'LLM',
      user_properties: {
        system_prompt:
          'You are a senior recruiter. You will receive a job description and a list of candidate profiles. ' +
          'For each candidate, output a JSON array with this structure:\n' +
          '[\n' +
          '  {\n' +
          '    "rank": integer,\n' +
          '    "applicant_name": string,\n' +
          '    "email": string,\n' +
          '    "score": float (0.0–1.0),\n' +
          '    "match_summary": string (2 sentences),\n' +
          '    "matched_skills": [string],\n' +
          '    "gaps": [string],\n' +
          '    "recommendation": "shortlist" | "consider" | "reject"\n' +
          '  }\n' +
          ']\n' +
          'Sort by score descending. Return ONLY valid JSON array — no markdown, no commentary.',
        temperature: 0.2,
        max_tokens: 2048,
      },
      input_contract: {
        context: { type: 'string', required: true, description: 'Retrieved candidate chunks' },
        query:   { type: 'string', required: true, description: 'Original job description query' },
      },
      output_contract: {
        text: { type: 'string', required: true, description: 'JSON array of ranked candidates' },
      },
      executionStatus: 'idle',
    },
  },

  // Step S-3: Response Builder — transformer_node
  {
    id: 'ats-response',
    type: 'agentNode',
    position: { x: X_SEARCH, y: Y_STEP3 },
    data: {
      name: 'transformer_node',
      label: 'Response Builder',
      description:
        'Packages the ranked candidates list into the final API response with status, ' +
        'query, total candidates, and search metadata.',
      node_type: 'Node',
      category: 'Data',
      group: 'Data',
      icon: 'package',
      color: '#10b981',
      badge: 'Transform',
      user_properties: {
        mapping_template: JSON.stringify({
          status:           'success',
          query:            '{{ input_data.query }}',
          candidates:       '{{ input_data.text }}',
          total_candidates: '{{ input_data.results | length }}',
          search_metadata: {
            top_k:   10,
            source:  'ats-cv-pool',
          },
        }),
        output_format: 'json',
      },
      executionStatus: 'idle',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Edges
// ─────────────────────────────────────────────────────────────────────────────
export const hrEdges: Edge[] = [
  // Trigger → ingest path (condition on mode field)
  {
    id: 'e-trigger-extractor',
    source: 'ats-trigger',
    target: 'ats-cv-extractor',
    label: 'mode = ingest',
    animated: true,
    data: { condition: 'ingest' },
  },
  // Ingest path
  { id: 'e-extractor-tagger',  source: 'ats-cv-extractor',  target: 'ats-cv-tagger',       animated: true },
  { id: 'e-tagger-ingest',     source: 'ats-cv-tagger',     target: 'ats-vectordb-ingest',  animated: true },
  { id: 'e-ingest-confirm',    source: 'ats-vectordb-ingest',target: 'ats-ingest-confirm',   animated: true },

  // Trigger → search path
  {
    id: 'e-trigger-search',
    source: 'ats-trigger',
    target: 'ats-search',
    label: 'mode = search',
    animated: true,
    data: { condition: 'search' },
  },
  // Search path
  { id: 'e-search-ranker',   source: 'ats-search',  target: 'ats-ranker',   animated: true },
  { id: 'e-ranker-response', source: 'ats-ranker',  target: 'ats-response', animated: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Payload for saveAgent API
// ─────────────────────────────────────────────────────────────────────────────
export const hrDemoPayload = {
  id:          HR_FLOW_ID,
  name:        HR_FLOW_NAME,
  description: HR_FLOW_DESCRIPTION,
  category:    HR_FLOW_CATEGORY,
  is_enabled:  true,
  nodes:       hrNodes,
  edges:       hrEdges,
  properties:  {},
};

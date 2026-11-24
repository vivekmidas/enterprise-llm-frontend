'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FolderOpen,
  GitCompareArrows,
  Landmark,
  LayoutDashboard,
  Library,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'

const scenarios = [
  { id: 'commercial', label: 'Commercial recovery', detail: 'Supply dispute · 3 documents' },
  { id: 'cheque', label: 'Cheque bounce matter', detail: 'NI Act · Initial assessment' },
  { id: 'employment', label: 'Employment dispute', detail: 'Termination · 2 documents' },
]

const baseGaps = [
  { title: 'Notice service is not verified', detail: 'No delivery proof is attached for the demand notice dated 22 Apr 2025.', tag: 'Evidence gap', tone: 'amber', source: 'Demand notice · 22 Apr 2025' },
  { title: 'Contractual cure period may be open', detail: 'Clause 7.2 refers to a 30-day cure period. The chronology needs confirmation.', tag: 'Needs review', tone: 'slate', source: 'Master Supply Agreement · Clause 7.2' },
  { title: 'Invoice acknowledgement is available', detail: 'The email thread contains an acknowledgement of the outstanding balance.', tag: 'Verified fact', tone: 'sage', source: 'Email thread · 06 May 2025' },
]

const enrichedGap = { title: 'New WhatsApp evidence changes chronology', detail: 'A message dated 18 Apr 2025 suggests the delivery issue was discussed before the demand notice was sent.', tag: 'New context', tone: 'navy', source: 'WhatsApp export · 18 Apr 2025' }

export default function LegalPilotPage() {
  const [scenario, setScenario] = useState('commercial')
  const [activeView, setActiveView] = useState('gaps')
  const [enriched, setEnriched] = useState(false)
  const [reviewed, setReviewed] = useState<string[]>([])

  const currentScenario = scenarios.find((item) => item.id === scenario) ?? scenarios[0]
  const gaps = useMemo(() => enriched ? [enrichedGap, ...baseGaps] : baseGaps, [enriched])

  const toggleReviewed = (title: string) => {
    setReviewed((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title])
  }

  return (
    <main className="legal-pilot min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Scale /></div>
            <div><p className="font-heading text-base font-semibold tracking-tight">Legal Pilot</p><p className="text-xs text-muted-foreground">Decision support workspace</p></div>
            <span className="ml-2 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Demo mode</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> No authentication required for this mockup <button className="rounded-md border border-border px-3 py-2 font-medium text-foreground hover:bg-muted">Exit demo</button></div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden w-64 shrink-0 border-r border-border px-4 py-6 lg:block">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
          <nav className="mt-3 flex flex-col gap-1">
            {[['Matter overview', LayoutDashboard], ['Evidence vault', FolderOpen], ['Precedents', Library], ['Strategy branches', GitCompareArrows], ['Drafts & exports', FileText]].map(([label, Icon], index) => <button key={label as string} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm ${index === 0 ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted'}`}><Icon className="size-4" />{label as string}{index === 1 && <span className="ml-auto rounded-full bg-muted-foreground/15 px-1.5 text-[10px]">3</span>}</button>)}
          </nav>
          <div className="mt-8 rounded-lg border border-border bg-muted/40 p-4"><p className="text-xs font-semibold">Demo workspace</p><p className="mt-1 text-xs leading-5 text-muted-foreground">All information shown here is local sample data. No live legal analysis is connected.</p></div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
            <div><div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><span>Matters</span><ChevronRight className="size-3" /><span>Initial assessment</span></div><h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Orion Components v. Delta Systems</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Commercial recovery matter · Delhi District Court · Internal preparation workspace</p></div>
            <button onClick={() => setEnriched(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Upload className="size-4" /> Add evidence <span className="rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[10px]">Demo</span></button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[['Matter status', 'Initial assessment', Clock3], ['Evidence completeness', enriched ? '82%' : '68%', FileText], ['Open gaps', enriched ? '4 items' : '3 items', AlertCircle], ['Last reviewed', 'Today, 10:42', CheckCircle2]].map(([label, value, Icon]) => <div key={label as string} className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label as string}</p><Icon className="size-4 text-muted-foreground" /></div><p className="mt-3 font-heading text-lg font-semibold">{value as string}</p></div>)}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Primary view</p><h2 className="mt-1 font-heading text-xl font-semibold">Case analysis</h2></div><div className="flex rounded-md border border-border bg-card p-1">{[['gaps', 'Gap analysis'], ['actions', 'Possible actions'], ['timeline', 'Timeline']].map(([id, label]) => <button key={id} onClick={() => setActiveView(id)} className={`rounded px-3 py-1.5 text-xs font-semibold ${activeView === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{label}</button>)}</div></div>

              {activeView === 'gaps' && <div className="mt-4 flex flex-col gap-3">{gaps.map((gap) => <article key={gap.title} className="rounded-lg border border-border bg-card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex gap-3"><div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${gap.tone === 'amber' ? 'bg-amber-100 text-amber-800' : gap.tone === 'sage' ? 'bg-emerald-100 text-emerald-800' : gap.tone === 'navy' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><AlertCircle className="size-4" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{gap.title}</h3><span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{gap.tag}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{gap.detail}</p><p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"><FileText className="size-3.5" /> {gap.source}</p></div></div><button onClick={() => toggleReviewed(gap.title)} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold ${reviewed.includes(gap.title) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-border text-foreground hover:bg-muted'}`}>{reviewed.includes(gap.title) ? 'Marked reviewed' : 'Mark reviewed'}</button></div></article>)}</div>}
              {activeView === 'actions' && <div className="mt-4 grid gap-3 md:grid-cols-2">{['Preserve delivery and communication records', 'Confirm notice service and cure period', 'Prepare a without-prejudice settlement position', 'Review jurisdiction and limitation assumptions'].map((item) => <div key={item} className="rounded-lg border border-border bg-card p-5"><div className="flex items-start gap-3"><div className="flex size-8 items-center justify-center rounded-md bg-muted"><Plus className="size-4" /></div><div><h3 className="font-semibold">{item}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Suggested preparation step for counsel review. Not an instruction or legal conclusion.</p></div></div></div>)}</div>}
              {activeView === 'timeline' && <div className="mt-4 rounded-lg border border-border bg-card p-5"><div className="flex flex-col gap-5">{[['14 Mar 2025', 'Master Supply Agreement signed'], ['18 Apr 2025', enriched ? 'Delivery issue discussed on WhatsApp' : 'Potential missing communication'], ['22 Apr 2025', 'Demand notice issued'], ['06 May 2025', 'Balance acknowledged by email']].map(([date, event], index) => <div key={date} className="flex gap-4"><div className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">{date}</div><div className="relative flex-1 border-l border-border pb-1 pl-5 text-sm"><span className="absolute -left-1.5 top-0 size-3 rounded-full border-2 border-card bg-primary" />{event}</div></div>)}</div></div>}
            </div>

            <aside className="flex flex-col gap-4"><div className="rounded-lg border border-border bg-card p-5"><div className="flex items-center gap-2"><Landmark className="size-4 text-primary" /><h2 className="font-semibold">Matter context</h2></div><dl className="mt-4 flex flex-col gap-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Matter type</dt><dd className="font-medium text-right">{currentScenario.label}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Forum</dt><dd className="font-medium text-right">Delhi District Court</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Stage</dt><dd className="font-medium text-right">Pre-filing review</dd></div></dl></div>
              <div className="rounded-lg border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Scenario selector</h2><Sparkles className="size-4 text-primary" /></div><div className="mt-3 flex flex-col gap-2">{scenarios.map((item) => <button key={item.id} onClick={() => setScenario(item.id)} className={`rounded-md border p-3 text-left ${scenario === item.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></button>)}</div></div>
              <div className={`rounded-lg border p-5 ${enriched ? 'border-primary/30 bg-primary/5' : 'border-amber-200 bg-amber-50/60'}`}><div className="flex gap-3"><GitCompareArrows className="mt-0.5 size-4 shrink-0 text-primary" /><div><h2 className="font-semibold">{enriched ? 'Analysis updated' : 'What changed?'}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{enriched ? 'A new evidence item was added to the chronology. Review the highlighted gap before relying on this workspace.' : 'Use “Add evidence” to simulate source-backed enrichment. This demo will show how the review state changes.'}</p>{enriched && <button onClick={() => setActiveView('gaps')} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Review new gap <ArrowUpRight className="size-3" /></button>}</div></div></div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

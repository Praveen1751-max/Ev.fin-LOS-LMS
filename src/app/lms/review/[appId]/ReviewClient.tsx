'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Download, ExternalLink, CheckCircle, XCircle, MessageSquare, SendHorizonal } from 'lucide-react'
import { CIBILGauge } from '@/components/charts/CIBILGauge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { fmtINR, fmtDate, calcTATHours, tatColor, tatBg } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'
import type { Application, Document, CreditDecision } from '@/lib/types'

type DecisionType = 'approve' | 'reject' | 'query' | 'refer_to_rcm'

interface Props {
  app: Application & { fso?: { name: string; phone?: string } | null; dealer?: { name: string; city: string; state: string } | null }
  docs: Document[]
  decisions: (CreditDecision & { analyst?: { name: string; role: string } | null })[]
}

const DOC_LABELS: Record<string, string> = {
  income_proof: 'Income Proof',
  address_proof: 'Address Proof',
  bank_statement: 'Bank Statement',
  vehicle_quote: 'Vehicle Quotation',
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
}

export function ReviewClient({ app, docs, decisions }: Props) {
  const router = useRouter()
  const [toast, showToast] = useToast()
  const [modal, setModal] = useState<DecisionType | null>(null)
  const [remarks, setRemarks] = useState('')
  const [queryMsg, setQueryMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(docs[0] ?? null)

  const cibil = (app.meta as Record<string, unknown> | undefined)?.cibil_score as number | undefined ?? app.cibil_score
  const tat = calcTATHours(app.submitted_at)

  const submitDecision = async (type: DecisionType) => {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newStatus = type === 'approve' ? 'approved'
        : type === 'reject' ? 'rejected'
        : type === 'query' ? 'query_raised'
        : 'referred_to_rcm'

      await supabase.from('credit_decisions').insert({
        application_id: app.id,
        analyst_id: user.id,
        decision: type,
        remarks: type === 'query' ? queryMsg : remarks,
        decided_at: new Date().toISOString(),
      })

      await supabase.from('applications').update({ status: newStatus }).eq('id', app.id)

      await supabase.from('activity_log').insert({
        application_id: app.id,
        actor_id: user.id,
        action: `decision:${type}`,
        meta: { reason: type === 'query' ? queryMsg : remarks },
      })

      showToast(`Decision recorded: ${type.replace('_', ' ')}`)
      setModal(null)
      setTimeout(() => router.push('/lms/queue'), 1200)
    } catch (err) {
      showToast('Failed to save decision')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {toast}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: 0 }}>
          <ArrowLeft size={16} /> Queue
        </button>
        <span style={{ color: 'var(--line)' }}>/</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{app.app_number}</span>
        <StatusBadge status={app.status} />
        <span style={{ marginLeft: 'auto', background: tatBg(tat), color: tatColor(tat), borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>TAT {tat}h</span>
      </div>

      {/* 3-Panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Panel 1 — Applicant details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {/* Applicant */}
          <Section title="Applicant">
            <Row label="Name" value={app.customer_name} bold />
            <Row label="Mobile" value={app.customer_phone} />
            <Row label="City" value={`${app.city}, ${app.state}`} />
            <Row label="Pincode" value={app.pincode} />
            <Row label="Aadhaar" value={app.aadhaar_ref ? `XXXX-XXXX-${app.aadhaar_ref.slice(-4)}` : '—'} />
            <Row label="PAN" value={app.pan_number ?? app.pan ?? '—'} />
          </Section>

          {/* Vehicle & Loan */}
          <Section title="Vehicle & Loan">
            <Row label="OEM" value={app.oem?.toUpperCase()} />
            <Row label="Model" value={app.model ?? app.vehicle_model} />
            <Row label="Loan Amt" value={fmtINR(app.loan_amount)} bold />
            <Row label="Down Pmt" value={fmtINR(app.down_payment)} />
            <Row label="Tenure" value={`${app.tenure_months}m`} />
            <Row label="EMI" value={app.emi ? fmtINR(app.emi) : (app.emi_amount ? fmtINR(app.emi_amount) : '—')} />
            <Row label="Dealer" value={app.dealer?.name ?? '—'} />
            <Row label="FSO" value={app.fso?.name ?? '—'} />
            <Row label="Submitted" value={app.submitted_at ? fmtDate(app.submitted_at) : '—'} />
          </Section>

          {/* CIBIL */}
          {cibil && (
            <Section title="Credit Score">
              <CIBILGauge score={cibil} />
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                {cibil >= 750 ? 'Excellent' : cibil >= 700 ? 'Good' : cibil >= 650 ? 'Fair' : 'Poor'} · Auto-approve threshold: 720+
              </div>
            </Section>
          )}

          {/* Decision history */}
          {decisions.length > 0 && (
            <Section title="Decision History">
              {decisions.map((d, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: (d.decision ?? d.action) === 'approve' ? 'var(--teal)' : (d.decision ?? d.action) === 'reject' ? 'var(--red)' : 'var(--amber)' }}>
                    {(d.decision ?? d.action ?? '').replace('_', ' ')}
                  </div>
                  <div style={{ color: 'var(--ink-3)' }}>{d.analyst?.name} · {d.decided_at ? fmtDate(d.decided_at) : (d.created_at ? fmtDate(d.created_at) : '—')}</div>
                  {(d.remarks ?? d.remark) && <div style={{ color: 'var(--ink-2)', marginTop: 2 }}>{d.remarks ?? d.remark}</div>}
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Panel 2 — Document viewer */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Doc tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', borderBottom: '1px solid var(--line)', overflowX: 'auto' }}>
            {docs.map(doc => (
              <button key={doc.id} onClick={() => setSelectedDoc(doc)} style={{
                background: selectedDoc?.id === doc.id ? 'var(--teal)' : 'var(--line)',
                color: selectedDoc?.id === doc.id ? '#fff' : 'var(--ink-2)',
                border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
                padding: '6px 12px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                <FileText size={12} style={{ marginRight: 4 }} />
                {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
              </button>
            ))}
            {docs.length === 0 && <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--ink-3)' }}>No documents uploaded</div>}
          </div>

          {/* Doc preview */}
          <div style={{ flex: 1, position: 'relative', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedDoc ? (
              selectedDoc.file_url ? (
                selectedDoc.file_url.match(/\.(pdf)$/i) ? (
                  <iframe src={selectedDoc.file_url} style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedDoc.file_url} alt={selectedDoc.doc_type} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                )
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
                  <FileText size={48} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <div>Document not yet uploaded</div>
                </div>
              )
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Select a document</div>
            )}
            {selectedDoc?.file_url && (
              <a href={selectedDoc.file_url} target="_blank" rel="noreferrer" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={12} /> Open
              </a>
            )}
          </div>
        </div>

        {/* Panel 3 — Decision */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Section title="Credit Decision">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" style={{ justifyContent: 'center', height: 40, fontSize: 13, background: 'var(--teal)', gap: 8 }} onClick={() => setModal('approve')}>
                <CheckCircle size={16} /> Approve
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center', height: 40, fontSize: 13, color: 'var(--red)', borderColor: 'var(--red)', gap: 8 }} onClick={() => setModal('reject')}>
                <XCircle size={16} /> Reject
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center', height: 40, fontSize: 13, color: 'var(--amber)', borderColor: 'var(--amber)', gap: 8 }} onClick={() => setModal('query')}>
                <MessageSquare size={16} /> Raise Query
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center', height: 40, fontSize: 13, gap: 8 }} onClick={() => setModal('refer_to_rcm')}>
                <SendHorizonal size={16} /> Refer to RCM
              </button>
            </div>
          </Section>

          <Section title="Sanction Letter">
            <a href={`/api/sanction-letter/${app.id}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center', height: 36, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={14} /> Download PDF
            </a>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Available once approved</div>
          </Section>

          {/* Compliance checks */}
          <Section title="Compliance">
            {[
              { label: 'Pincode eligible', ok: !['500032', '534001', '500044'].includes(app.pincode ?? '') },
              { label: 'CIBIL ≥ 650', ok: cibil ? cibil >= 650 : null },
              { label: 'LTV ≤ 90%', ok: app.loan_amount && (app.vehicle_price ?? 0) > 0 ? (app.loan_amount / app.vehicle_price!) <= 0.90 : null },
              { label: 'Aadhaar verified', ok: !!app.aadhaar_ref },
              { label: 'PAN verified', ok: !!(app.pan_number ?? app.pan) },
              { label: 'All docs uploaded', ok: docs.length >= 4 },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line-2, #f5f5f5)', fontSize: 12 }}>
                <span style={{ color: 'var(--ink-2)' }}>{c.label}</span>
                <span style={{ fontWeight: 700, color: c.ok === null ? 'var(--ink-3)' : c.ok ? 'var(--teal)' : 'var(--red)' }}>
                  {c.ok === null ? '—' : c.ok ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </Section>
        </div>
      </div>

      {/* Decision Modal */}
      {modal && (
        <div className="modal-scrim" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
              {modal === 'approve' ? 'Approve Application'
                : modal === 'reject' ? 'Reject Application'
                : modal === 'query' ? 'Raise Query to FSO'
                : 'Refer to RCM'}
            </h3>
            <div style={{ marginBottom: 4, fontSize: 12, color: 'var(--ink-3)' }}>App: {app.app_number} · {app.customer_name}</div>
            <div style={{ height: 12 }} />
            <label className="label">{modal === 'query' ? 'Query message (FSO will see this)' : 'Remarks'}</label>
            <textarea
              value={modal === 'query' ? queryMsg : remarks}
              onChange={e => modal === 'query' ? setQueryMsg(e.target.value) : setRemarks(e.target.value)}
              className="input"
              rows={4}
              placeholder={modal === 'approve' ? 'Optional remarks…' : modal === 'reject' ? 'Reason for rejection…' : modal === 'query' ? 'What does the FSO need to re-upload or clarify?' : 'Notes for RCM…'}
              style={{ resize: 'vertical', fontFamily: 'inherit', width: '100%' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)} style={{ height: 38, padding: '0 18px' }}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={submitting || (modal === 'reject' && !remarks.trim()) || (modal === 'query' && !queryMsg.trim())}
                onClick={() => submitDecision(modal)}
                style={{ height: 38, padding: '0 22px', background: modal === 'reject' ? 'var(--red)' : modal === 'query' ? 'var(--amber)' : 'var(--teal)', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value?: string | null; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--line-2, #f5f5f5)' }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 600 : 400, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value ?? '—'}</span>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { CheckSquare, Wallet, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { fmtINR, fmtDateTime } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'

interface PendingApp {
  id: string
  app_number: string
  customer_name: string
  loan_amount: number
  status: string
  submitted_at: string
  fso?: { name: string } | null
  dealer?: { name: string; city: string; bank_account?: string; ifsc?: string } | null
}

interface RecentDisbursement {
  id: string
  txn_ref: string
  amount: number
  initiated_at: string
  application?: { app_number: string; customer_name: string; loan_amount: number } | null
}

const CHECKLIST_ITEMS = [
  'Sanction letter signed by applicant',
  'Bank account verification completed',
  'Vehicle registration in-principle confirmed',
  'Insurance policy number captured',
  'Post-dated cheques / NACH mandate collected',
  'Disbursement memo approved by RCM',
]

export function DisbursementClient({ pending, recent }: { pending: PendingApp[]; recent: RecentDisbursement[] }) {
  const [toast, showToast] = useToast()
  const [selected, setSelected] = useState<PendingApp | null>(null)
  const [checks, setChecks] = useState<Record<number, boolean>>({})
  const [disbursing, setDisbursing] = useState(false)

  const allChecked = CHECKLIST_ITEMS.every((_, i) => checks[i])

  const handleDisburse = async () => {
    if (!selected || !allChecked) return
    setDisbursing(true)
    try {
      const supabase = createClient()
      const txnRef = `TXN${Date.now()}`
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('disbursements').insert({
        application_id: selected.id,
        amount: selected.loan_amount,
        txn_ref: txnRef,
        initiated_by: user?.id,
        initiated_at: new Date().toISOString(),
        status: 'completed',
      })

      await supabase.from('applications').update({ status: 'disbursed' }).eq('id', selected.id)

      await supabase.from('activity_log').insert({
        application_id: selected.id,
        actor_id: user?.id,
        action: 'decision:disburse',
        meta: { reason: txnRef },
      })

      showToast(`Disbursed ${fmtINR(Number(selected.loan_amount))} · ${txnRef}`)
      setSelected(null)
      setChecks({})
    } catch {
      showToast('Disbursement failed')
    } finally {
      setDisbursing(false)
    }
  }

  return (
    <div>
      {toast}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Credit Operations · West Region</div>
        <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Disbursement</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Pending list */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Pending Disbursement <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 400 }}>({pending.length})</span></h3>
          {pending.length === 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No applications pending disbursement
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(app => (
              <div key={app.id} onClick={() => { setSelected(app); setChecks({}) }} style={{
                background: 'var(--surface)', border: `1px solid ${selected?.id === app.id ? 'var(--teal)' : 'var(--line)'}`,
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                boxShadow: selected?.id === app.id ? '0 0 0 2px rgba(15,110,86,0.15)' : 'none',
                transition: 'all 150ms',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{app.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{app.app_number} · {app.fso?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>₹{(app.loan_amount / 100000).toFixed(1)}L</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{fmtDateTime(app.submitted_at)}</div>
                  </div>
                </div>
                {app.dealer && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-2)', display: 'flex', gap: 12 }}>
                    <span>Dealer: {app.dealer.name}</span>
                    {app.dealer.bank_account && <span>A/C: ···{app.dealer.bank_account.slice(-4)}</span>}
                    {app.dealer.ifsc && <span>IFSC: {app.dealer.ifsc}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recent disbursements */}
          <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>Recent Disbursements</h3>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
            {recent.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No disbursements yet</div>}
            {recent.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < recent.length - 1 ? '1px solid var(--line-2, #f5f5f5)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.application?.customer_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{d.application?.app_number} · {d.txn_ref}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--teal)' }}>₹{((Number(d.amount) ?? 0) / 100000).toFixed(1)}L</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{fmtDateTime(d.initiated_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist panel */}
        <div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CheckSquare size={18} color="var(--teal)" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Pre-Disbursal Checklist</h3>
            </div>

            {!selected && (
              <div style={{ color: 'var(--ink-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Select an application to proceed
              </div>
            )}

            {selected && (
              <>
                <div style={{ background: 'rgba(15,110,86,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{selected.customer_name}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{selected.app_number} · {fmtINR(selected.loan_amount)}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {CHECKLIST_ITEMS.map((item, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={!!checks[i]} onChange={e => setChecks(p => ({ ...p, [i]: e.target.checked }))} style={{ marginTop: 2, accentColor: 'var(--teal)', width: 15, height: 15 }} />
                      <span style={{ color: checks[i] ? 'var(--ink-3)' : 'var(--ink)', lineHeight: 1.4 }}>{item}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
                  <Clock size={12} />
                  {CHECKLIST_ITEMS.filter((_, i) => checks[i]).length}/{CHECKLIST_ITEMS.length} items verified
                </div>

                <button
                  className="btn btn-primary"
                  disabled={!allChecked || disbursing}
                  onClick={handleDisburse}
                  style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14, gap: 8, opacity: !allChecked ? 0.4 : 1 }}>
                  <Wallet size={18} />
                  {disbursing ? 'Processing…' : `Disburse ${fmtINR(selected.loan_amount)}`}
                </button>

                {!allChecked && <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 8 }}>Complete all checklist items to enable disbursement</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FsoShell } from '@/components/fso/FsoShell'
import { ChevronLeft, X, ChevronRight, Check, Camera, Shield, FileText, MapPin } from 'lucide-react'
import { usePincodeCheck } from '@/lib/hooks/usePincodeCheck'
import { calcEMI, fmtINR, fmtINRShort } from '@/lib/utils/formatters'
import { OEM_CONFIG, NEGATIVE_PINCODES } from '@/lib/types'
import type { Profile, Dealer, OEM } from '@/lib/types'

const OEMS = Object.entries(OEM_CONFIG).map(([id, cfg]) => ({ id: id as OEM, ...cfg }))

interface WizardForm {
  name: string; mobile: string; city: string; pincode: string; state: string
  oem: OEM | null; model: string; dealerId: string
  amount: number; down: number; tenure: 24 | 36 | 48
  aadhaar: string; otpSent: boolean; otp: string; pan: string; selfie: boolean
  docs: { income: boolean; address: boolean; bank: boolean; quote: boolean }
}

export function NewLoanWizardClient({ profile, dealers }: { profile: Profile | null; dealers: Dealer[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [form, setForm] = useState<WizardForm>({
    name: '', mobile: '', city: '', pincode: '', state: '',
    oem: null, model: '', dealerId: '',
    amount: 95000, down: 15000, tenure: 36,
    aadhaar: '', otpSent: false, otp: '', pan: '', selfie: false,
    docs: { income: false, address: false, bank: false, quote: false },
  })

  const { result: pincodeResult, checking: pincodeChecking, check: checkPincode } = usePincodeCheck()

  const update = <K extends keyof WizardForm>(k: K, v: WizardForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const principal = Math.max(form.amount - form.down, 1000)
  const emi = calcEMI(principal, 13.5, form.tenure)
  const docCount = Object.values(form.docs).filter(Boolean).length

  const pincodeOk = pincodeResult?.eligible ?? (NEGATIVE_PINCODES.includes(form.pincode) ? false : null)
  const pincodeStatus = form.pincode.length === 6 ? (pincodeOk === false ? 'bad' : pincodeOk === true ? 'ok' : null) : null

  const isValid: Record<number, boolean> = {
    1: Boolean(form.name && form.mobile.length === 10 && form.city && pincodeStatus === 'ok' && form.oem && form.model),
    2: Boolean(form.aadhaar.length === 12 && form.otp.length === 6 && form.pan.length === 10 && form.selfie),
    3: docCount === 4,
    4: true,
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.mobile,
          city: form.city,
          pincode: form.pincode,
          state: pincodeResult?.state ?? form.state,
          oem: form.oem,
          vehicle_model: form.model,
          dealer_id: form.dealerId || null,
          loan_amount: form.amount,
          down_payment: form.down,
          tenure_months: form.tenure,
          emi_amount: emi,
          roi: 13.5,
          ltv_percent: Math.round((principal / form.amount) * 100),
          pan: form.pan,
          aadhaar_ref: form.aadhaar.slice(-4),
          kyc_status: 'verified',
          selfie_url: 'stub',
          is_negative_area: false,
        }),
      })
      const data = await res.json()
      if (data.app_number) {
        setSubmittedId(data.app_number)
        setStep(5)
      }
    } catch {
      alert('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const STEPS = ['Lead capture', 'KYC verification', 'Document upload', 'Review & submit']

  return (
    <FsoShell profile={profile}>
      {/* Header */}
      {step <= 4 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 8 }}>
          <button
            onClick={() => step === 1 ? router.push('/fso/home') : setStep(s => s - 1)}
            style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            {step === 1 ? <X size={16} /> : <ChevronLeft size={16} />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.1 }}>{STEPS[step - 1]}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Step {step} of 4</div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {step <= 4 && (
        <div style={{ display: 'flex', gap: 6, margin: '12px 4px 16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? 'var(--teal)' : 'var(--line)',
              transition: 'background 300ms',
            }} />
          ))}
        </div>
      )}

      {/* Steps */}
      {step === 1 && <Step1 form={form} update={update} pincodeStatus={pincodeStatus} pincodeResult={pincodeResult} checkPincode={checkPincode} pincodeChecking={pincodeChecking} dealers={dealers} principal={principal} emi={emi} />}
      {step === 2 && <Step2 form={form} update={update} />}
      {step === 3 && <Step3 form={form} update={update} docCount={docCount} />}
      {step === 4 && <Step4 form={form} emi={emi} principal={principal} docCount={docCount} />}
      {step === 5 && submittedId && <SuccessScreen appId={submittedId} onDone={() => router.push('/fso/home')} />}

      {/* Next button */}
      {step <= 4 && (
        <div style={{
          position: 'sticky', bottom: 0,
          margin: '16px -16px -24px',
          padding: '12px 16px 16px',
          background: 'linear-gradient(to top, #F4F6F5 60%, rgba(244,246,245,0))',
        }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!isValid[step] || submitting}
            onClick={() => step < 4 ? setStep(s => s + 1) : handleSubmit()}
          >
            {submitting ? 'Submitting…' : step < 4 ? 'Continue' : 'Submit application'}
            {!submitting && <ChevronRight size={16} />}
          </button>
        </div>
      )}
    </FsoShell>
  )
}

// ── Step 1: Lead Capture ──────────────────────────────────────────
function Step1({ form, update, pincodeStatus, pincodeResult, checkPincode, pincodeChecking, dealers, principal, emi }: {
  form: WizardForm; update: (k: keyof WizardForm, v: WizardForm[keyof WizardForm]) => void
  pincodeStatus: 'ok' | 'bad' | null; pincodeResult: { city?: string; state?: string } | null
  checkPincode: (p: string) => void; pincodeChecking: boolean
  dealers: Dealer[]; principal: number; emi: number
}) {
  const selectedOem = form.oem ? OEM_CONFIG[form.oem] : null
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <label className="label">Customer name</label>
        <input className="input" placeholder="e.g. Ravi Kumar" value={form.name} onChange={e => update('name', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="label">Mobile</label>
          <input className="input" type="tel" maxLength={10} placeholder="10-digit" value={form.mobile} onChange={e => update('mobile', e.target.value.replace(/\D/g, ''))} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" placeholder="e.g. Pune" value={form.city} onChange={e => update('city', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Pincode</label>
        <input
          className={`input ${pincodeStatus === 'bad' ? 'error' : ''}`}
          type="tel" maxLength={6}
          placeholder="6-digit pincode"
          value={form.pincode}
          onChange={e => { update('pincode', e.target.value.replace(/\D/g, '')); checkPincode(e.target.value.replace(/\D/g, '')) }}
        />
        {pincodeChecking && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>Checking…</div>}
        {!pincodeChecking && pincodeStatus === 'ok' && (
          <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: 'var(--teal-50)', color: 'var(--teal)', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={12} /> Area eligible{pincodeResult?.city ? ` · ${pincodeResult.city}` : ''} — Standard rate applies
          </div>
        )}
        {!pincodeChecking && pincodeStatus === 'bad' && (
          <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: 'var(--red-50)', color: 'var(--red)', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={12} /> Negative area — cannot proceed
          </div>
        )}
      </div>

      <div>
        <label className="label" style={{ marginBottom: 10 }}>Select OEM</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {OEMS.map(o => (
            <button key={o.id}
              style={{
                padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1px solid',
                borderColor: form.oem === o.id ? 'var(--teal)' : 'var(--line)',
                background: form.oem === o.id ? 'var(--teal)' : 'var(--surface)',
                color: form.oem === o.id ? '#fff' : 'var(--ink)',
                cursor: 'pointer', transition: 'all 120ms',
              }}
              onClick={() => { update('oem', o.id); update('model', '') }}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {selectedOem && (
        <div>
          <label className="label">Vehicle model</label>
          <select className="input" value={form.model} onChange={e => update('model', e.target.value)}>
            <option value="">Select model</option>
            {selectedOem.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {form.oem && dealers.filter(d => d.oem === form.oem).length > 0 && (
        <div>
          <label className="label">Dealer (optional)</label>
          <select className="input" value={form.dealerId} onChange={e => update('dealerId', e.target.value)}>
            <option value="">Select dealer</option>
            {dealers.filter(d => d.oem === form.oem).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label" style={{ marginBottom: 10 }}>Loan details</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label className="label">Loan amount</label>
            <input className="input" type="tel" value={form.amount} onChange={e => update('amount', parseInt(e.target.value.replace(/\D/g, '') || '0'))} />
          </div>
          <div>
            <label className="label">Down payment</label>
            <input className="input" type="tel" value={form.down} onChange={e => update('down', parseInt(e.target.value.replace(/\D/g, '') || '0'))} />
          </div>
        </div>
        <label className="label">Tenure</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {([24, 36, 48] as const).map(t => (
            <button key={t}
              style={{
                border: '1px solid', borderRadius: 10, padding: '10px 4px',
                fontSize: 13, fontWeight: 600, textAlign: 'center', cursor: 'pointer',
                borderColor: form.tenure === t ? 'var(--teal)' : 'var(--line)',
                background: form.tenure === t ? 'var(--teal-50)' : 'var(--surface)',
                color: form.tenure === t ? 'var(--teal)' : 'var(--ink)',
              }}
              onClick={() => update('tenure', t)}
            >
              {t}<small style={{ display: 'block', fontWeight: 400, fontSize: 10, color: form.tenure === t ? 'var(--teal)' : 'var(--ink-3)', marginTop: 2 }}>months</small>
            </button>
          ))}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, #073562 100%)',
          color: '#fff', borderRadius: 12, padding: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14,
        }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated EMI</div>
            <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>{fmtINR(emi)}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>on {fmtINRShort(principal)} financed</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, opacity: 0.7 }}>
            ROI<br /><b style={{ color: '#fff', fontSize: 14 }}>13.5%</b>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 2: KYC ───────────────────────────────────────────────────
function Step2({ form, update }: { form: WizardForm; update: (k: keyof WizardForm, v: WizardForm[keyof WizardForm]) => void }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Aadhaar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-50)', color: 'var(--blue)', display: 'grid', placeItems: 'center' }}>
            <Shield size={14} />
          </div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Aadhaar verification</h3>
          {form.otp.length === 6 && <span className="badge b-teal" style={{ marginLeft: 'auto' }}><span className="dot" />Verified</span>}
        </div>
        <label className="label">Aadhaar number</label>
        <input className="input" type="tel" maxLength={12} placeholder="1234 5678 9012"
          value={form.aadhaar} onChange={e => update('aadhaar', e.target.value.replace(/\D/g, '').slice(0, 12))} />
        {form.aadhaar.length === 12 && !form.otpSent && (
          <button className="btn btn-primary" style={{ marginTop: 10, width: '100%' }} onClick={() => update('otpSent', true)}>
            Send OTP to ••••••{form.aadhaar.slice(-4)}
          </button>
        )}
        {form.otpSent && (
          <div style={{ marginTop: 12 }}>
            <label className="label">Enter 6-digit OTP</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2, 3, 4, 5].map(i => {
                const d = form.otp[i] ?? ''
                return <div key={i} style={{
                  flex: 1, height: 48, borderRadius: 10, border: '1px solid',
                  borderColor: d ? 'var(--teal)' : 'var(--line)',
                  background: d ? 'var(--teal-50)' : 'var(--surface)',
                  color: 'var(--teal)', fontSize: 17, fontWeight: 600,
                  display: 'grid', placeItems: 'center',
                }}>{d}</div>
              })}
            </div>
            <input type="tel" maxLength={6}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
              value={form.otp} onChange={e => update('otp', e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <button className="btn btn-secondary" style={{ marginTop: 10, width: '100%', height: 38, fontSize: 13 }}
              onClick={() => update('otp', '847291')}>
              Auto-fill demo OTP
            </button>
          </div>
        )}
      </div>

      {/* PAN */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--purple-50)', color: 'var(--purple)', display: 'grid', placeItems: 'center' }}>
            <FileText size={14} />
          </div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>PAN verification</h3>
          {form.pan.length === 10 && <span className="badge b-teal" style={{ marginLeft: 'auto' }}><span className="dot" />Verified</span>}
        </div>
        <input className="input" maxLength={10} placeholder="ABCDE1234F"
          value={form.pan} onChange={e => update('pan', e.target.value.toUpperCase().slice(0, 10))} />
        {form.pan.length === 10 && (
          <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--teal-50)', color: 'var(--teal)', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={12} /> Verified · Match score 98%
          </div>
        )}
      </div>

      {/* Selfie */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--lime-50)', color: 'var(--lime)', display: 'grid', placeItems: 'center' }}>
            <Camera size={14} />
          </div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Selfie + liveness</h3>
          {form.selfie && <span className="badge b-teal" style={{ marginLeft: 'auto' }}><span className="dot" />Verified</span>}
        </div>
        <div
          onClick={() => update('selfie', !form.selfie)}
          style={{
            width: '100%', aspectRatio: '4/3',
            background: form.selfie ? 'linear-gradient(135deg, var(--teal) 0%, #14856a 100%)' : 'linear-gradient(135deg, #1a2a3a 0%, #0b1a2c 100%)',
            borderRadius: 12, display: 'grid', placeItems: 'center',
            color: '#fff', cursor: 'pointer', position: 'relative',
          }}
        >
          {form.selfie ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>✓</div>
              <div style={{ fontSize: 12 }}>Liveness verified</div>
            </div>
          ) : (
            <div style={{ width: 90, height: 90, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.5)', display: 'grid', placeItems: 'center' }}>
              <Camera size={36} color="rgba(255,255,255,0.6)" />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 11 }}>
            {form.selfie ? 'Tap to retake' : 'Tap to capture selfie'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Documents ─────────────────────────────────────────────
function Step3({ form, update, docCount }: {
  form: WizardForm
  update: (k: 'docs', v: WizardForm['docs']) => void
  docCount: number
}) {
  const docs = [
    { id: 'income'  as const, name: 'Income proof',      sub: 'Salary slip / ITR / Form-16' },
    { id: 'address' as const, name: 'Address proof',     sub: 'Aadhaar / utility bill' },
    { id: 'bank'    as const, name: 'Bank statement',    sub: 'Last 3 months PDF' },
    { id: 'quote'   as const, name: 'Vehicle quotation', sub: 'Pro-forma from dealer' },
  ]
  const toggle = (id: keyof typeof form.docs) => update('docs', { ...form.docs, [id]: !form.docs[id] })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
        <span>{docCount} of 4 documents uploaded</span>
        <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{Math.round((docCount / 4) * 100)}%</span>
      </div>
      <div style={{ background: 'var(--line-2)', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: `${(docCount / 4) * 100}%`, height: '100%', background: 'var(--teal)', transition: 'width 240ms ease' }} />
      </div>

      {docs.map(d => {
        const done = form.docs[d.id]
        return (
          <div key={d.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 14,
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0,
              background: done ? 'var(--teal-50)' : 'var(--line-2)',
              color: done ? 'var(--teal)' : 'var(--ink-3)',
            }}>
              {done ? <Check size={18} /> : <FileText size={16} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{d.sub}</div>
            </div>
            <button
              onClick={() => toggle(d.id)}
              style={{
                height: 32, padding: '0 12px', borderRadius: 8, border: 0,
                background: done ? 'var(--teal-50)' : 'var(--teal)', color: done ? 'var(--teal)' : '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {done ? <><Check size={12} /> Uploaded</> : <><Camera size={12} /> Capture</>}
            </button>
          </div>
        )
      })}

      {docCount === 4 && (
        <div style={{ marginTop: 12, padding: '12px', borderRadius: 8, background: 'var(--teal-50)', color: 'var(--teal)', fontSize: 12, fontWeight: 500, display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Check size={14} /> All documents uploaded — quality check passed
        </div>
      )}
    </div>
  )
}

// ── Step 4: Review ────────────────────────────────────────────────
function Step4({ form, emi, principal, docCount }: { form: WizardForm; emi: number; principal: number; docCount: number }) {
  const oem = form.oem ? OEM_CONFIG[form.oem] : null
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <SummaryCard title="Applicant" titleColor="var(--teal)" rows={[
        ['Mobile', `+91 ${form.mobile}`],
        ['City', `${form.city} · ${form.pincode}`],
        ['Aadhaar', `XXXX-XXXX-${form.aadhaar.slice(-4)}`],
        ['PAN', form.pan],
      ]} />
      <SummaryCard title={`${oem?.label ?? ''} ${form.model}`} titleColor="var(--blue)" subtitleLabel="Vehicle & loan" rows={[
        ['On-road price', fmtINR(form.amount)],
        ['Down payment', fmtINR(form.down)],
        ['Financed', fmtINR(principal)],
        ['Tenure', `${form.tenure} months @ 13.5%`],
      ]} highlight={['Monthly EMI', fmtINR(emi)]} />
      <SummaryCard title="All checks passed" titleColor="var(--lime)" subtitleLabel="Compliance" rows={[
        ['KYC status', 'Aadhaar + PAN verified'],
        ['Documents', `${docCount} of 4 uploaded`],
        ['Selfie liveness', 'Passed'],
        ['Negative area check', 'Cleared'],
      ]} />
    </div>
  )
}

function SummaryCard({ title, subtitleLabel, titleColor = 'var(--teal)', rows, highlight }: {
  title: string; subtitleLabel?: string; titleColor?: string
  rows: [string, string][]; highlight?: [string, string]
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: 14, background: titleColor + '22', color: titleColor, borderBottom: '1px solid var(--line)' }}>
        {subtitleLabel && <div style={{ fontSize: 12, opacity: 0.8 }}>{subtitleLabel}</div>}
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{title}</div>
      </div>
      {rows.map(([l, v]) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: 12, borderTop: '1px solid var(--line-2)' }}>
          <span style={{ color: 'var(--ink-3)' }}>{l}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
      {highlight && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: 12, borderTop: '1px solid var(--line-2)', background: 'var(--teal-50)' }}>
          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{highlight[0]}</span>
          <span style={{ color: 'var(--teal)', fontSize: 14, fontWeight: 700 }}>{highlight[1]}</span>
        </div>
      )}
    </div>
  )
}

// ── Success Screen ────────────────────────────────────────────────
function SuccessScreen({ appId, onDone }: { appId: string; onDone: () => void }) {
  const colors = ['#0F6E56', '#639922', '#BA7517', '#185FA5', '#534AB7']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px 30px', textAlign: 'center' }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'var(--teal)', display: 'grid', placeItems: 'center', color: '#fff',
        marginBottom: 20, position: 'relative',
        animation: 'pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <Check size={48} />
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 14
          const dist = 80 + Math.random() * 40
          return (
            <span key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 8, height: 8,
              background: colors[i % colors.length],
              borderRadius: i % 2 ? 0 : '50%',
              animationDelay: `${i * 30}ms`,
            }} />
          )
        })}
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Application submitted!</h2>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Your reference number</p>
      <div style={{
        marginTop: 10, padding: '8px 14px',
        background: 'var(--teal-50)', color: 'var(--teal)',
        borderRadius: 999, fontWeight: 700, fontFamily: 'monospace', fontSize: 14,
      }}>{appId}</div>
      <div style={{ marginTop: 18, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, width: '100%', textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--teal)' }}>Customer SMS sent ✓</div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          &quot;Hi, your ev.fin loan application <b style={{ color: 'var(--ink)' }}>{appId}</b> has been received. We will update you within 48 hours.&quot;
        </p>
      </div>
      <button className="btn btn-secondary" onClick={onDone} style={{ width: '100%', marginTop: 18 }}>
        ← Back to home
      </button>
    </div>
  )
}

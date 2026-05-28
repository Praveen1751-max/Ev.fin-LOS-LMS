import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id } = await req.json()
  if (!application_id) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })

  const { data: app } = await supabase.from('applications').select('loan_amount, status').eq('id', application_id).single()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!['approved', 'sanctioned'].includes(app.status)) {
    return NextResponse.json({ error: 'Application must be approved/sanctioned before disbursement' }, { status: 409 })
  }

  const txnRef = `TXN${Date.now()}`

  const { data, error } = await supabase.from('disbursements').insert({
    application_id,
    amount: app.loan_amount,
    txn_ref: txnRef,
    initiated_by: user.id,
    initiated_at: new Date().toISOString(),
    status: 'completed',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('applications').update({ status: 'disbursed' }).eq('id', application_id)

  await supabase.from('activity_log').insert({
    application_id,
    actor_id: user.id,
    action: 'decision:disburse',
    meta: { reason: txnRef },
  })

  return NextResponse.json({ ...data, txn_ref: txnRef }, { status: 201 })
}

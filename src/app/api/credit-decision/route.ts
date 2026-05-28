import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DECISION_STATUS: Record<string, string> = {
  approve: 'approved',
  reject: 'rejected',
  query: 'query_raised',
  refer_to_rcm: 'referred_to_rcm',
  sanction: 'sanctioned',
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { application_id, decision, remarks } = body

  if (!application_id || !decision) {
    return NextResponse.json({ error: 'Missing application_id or decision' }, { status: 400 })
  }

  const newStatus = DECISION_STATUS[decision]
  if (!newStatus) return NextResponse.json({ error: 'Invalid decision type' }, { status: 400 })

  const { data: dec, error: decErr } = await supabase.from('credit_decisions').insert({
    application_id,
    analyst_id: user.id,
    decision,
    remarks: remarks ?? '',
    decided_at: new Date().toISOString(),
  }).select().single()

  if (decErr) return NextResponse.json({ error: decErr.message }, { status: 500 })

  await supabase.from('applications').update({ status: newStatus }).eq('id', application_id)

  await supabase.from('activity_log').insert({
    application_id,
    actor_id: user.id,
    action: `decision:${decision}`,
    meta: { reason: remarks ?? decision },
  })

  return NextResponse.json(dec, { status: 201 })
}

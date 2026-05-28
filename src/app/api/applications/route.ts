import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAppNumber } from '@/lib/utils/formatters'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Number(searchParams.get('limit') ?? 100)

  let query = supabase.from('applications').select('*').order('submitted_at', { ascending: false }).limit(limit)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const appNumber = generateAppNumber()
  const payload = {
    app_number: appNumber,
    fso_id: user.id,
    status: 'submitted',
    customer_name: body.customer_name,
    customer_phone: body.customer_phone,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
    oem: body.oem,
    model: body.model,
    dealer_id: body.dealer_id || null,
    loan_amount: Number(body.loan_amount),
    down_payment: Number(body.down_payment),
    vehicle_price: Number(body.loan_amount) + Number(body.down_payment),
    tenure_months: Number(body.tenure_months),
    emi: body.emi ? Number(body.emi) : null,
    aadhaar_ref: body.aadhaar_ref || null,
    pan_number: body.pan_number || null,
    submitted_at: new Date().toISOString(),
    meta: body.meta ?? {},
  }

  const { data, error } = await supabase.from('applications').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    application_id: data.id,
    actor_id: user.id,
    action: 'application:submitted',
    meta: { app_number: appNumber },
  })

  return NextResponse.json(data, { status: 201 })
}

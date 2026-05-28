import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: apps } = await supabase
    .from('applications')
    .select('*, fso:profiles!fso_id(name), dealer:dealers(name, city)')
    .order('submitted_at', { ascending: false })
    .limit(2000)

  const xlsx = await import('xlsx')
  const wb = xlsx.utils.book_new()

  const rows = (apps ?? []).map(a => ({
    'App Number': a.app_number,
    'Customer Name': a.customer_name,
    'Mobile': a.customer_phone,
    'City': a.city,
    'State': a.state,
    'Pincode': a.pincode,
    'OEM': a.oem?.toUpperCase(),
    'Model': a.model,
    'Loan Amount': a.loan_amount,
    'Down Payment': a.down_payment,
    'Tenure (months)': a.tenure_months,
    'Status': a.status,
    'FSO': (a.fso as { name?: string } | null)?.name ?? '',
    'Dealer': (a.dealer as { name?: string } | null)?.name ?? '',
    'Submitted At': a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-IN') : '',
  }))

  const ws = xlsx.utils.json_to_sheet(rows)
  xlsx.utils.book_append_sheet(wb, ws, 'Applications')

  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="evfin-report-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}

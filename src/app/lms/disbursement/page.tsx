import { createClient } from '@/lib/supabase/server'
import { DisbursementClient } from './DisbursementClient'

export default async function DisbursementPage() {
  const supabase = await createClient()

  const { data: apps } = await supabase
    .from('applications')
    .select('*, fso:profiles!fso_id(name), dealer:dealers(name, city, bank_account, ifsc)')
    .in('status', ['sanctioned', 'approved'])
    .order('submitted_at', { ascending: true })

  const { data: recent } = await supabase
    .from('disbursements')
    .select('*, application:applications(app_number, customer_name, loan_amount)')
    .order('initiated_at', { ascending: false })
    .limit(20)

  return <DisbursementClient pending={apps ?? []} recent={recent ?? []} />
}

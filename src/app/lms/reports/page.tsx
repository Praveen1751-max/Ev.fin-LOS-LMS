import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [{ data: apps }, { data: fsos }] = await Promise.all([
    supabase.from('applications')
      .select('id, status, oem, loan_amount, submitted_at, state, fso_id')
      .order('submitted_at', { ascending: false })
      .limit(1000),
    supabase.from('profiles')
      .select('id, name')
      .eq('role', 'fso'),
  ])

  return <ReportsClient apps={apps ?? []} fsos={fsos ?? []} />
}

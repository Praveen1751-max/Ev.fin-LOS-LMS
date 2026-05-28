import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: apps }, { data: activity }] = await Promise.all([
    supabase.from('applications')
      .select('id, status, oem, loan_amount, submitted_at, state')
      .order('submitted_at', { ascending: false })
      .limit(500),
    supabase.from('activity_log')
      .select('*, actor:profiles!actor_id(name, role)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return <DashboardClient apps={apps ?? []} activity={activity ?? []} />
}

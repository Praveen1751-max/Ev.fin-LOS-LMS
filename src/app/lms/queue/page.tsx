import { createClient } from '@/lib/supabase/server'
import { QueueClient } from './QueueClient'

export default async function QueuePage() {
  const supabase = await createClient()

  const { data: apps } = await supabase
    .from('applications')
    .select('*, fso:profiles!fso_id(name), dealer:dealers(name, city)')
    .in('status', ['submitted', 'under_review', 'query_raised', 'referred_to_rcm'])
    .order('submitted_at', { ascending: true })
    .limit(200)

  return <QueueClient apps={apps ?? []} />
}

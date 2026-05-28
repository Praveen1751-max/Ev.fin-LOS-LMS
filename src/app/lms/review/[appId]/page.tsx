import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReviewClient } from './ReviewClient'

export default async function ReviewPage({ params }: { params: { appId: string } }) {
  const supabase = await createClient()

  const [{ data: app }, { data: docs }, { data: decisions }] = await Promise.all([
    supabase.from('applications')
      .select('*, fso:profiles!fso_id(name, phone), dealer:dealers(name, city, state)')
      .eq('id', params.appId)
      .single(),
    supabase.from('documents')
      .select('*')
      .eq('application_id', params.appId)
      .order('uploaded_at', { ascending: false }),
    supabase.from('credit_decisions')
      .select('*, analyst:profiles!analyst_id(name, role)')
      .eq('application_id', params.appId)
      .order('decided_at', { ascending: false })
      .limit(10),
  ])

  if (!app) notFound()

  return <ReviewClient app={app} docs={docs ?? []} decisions={decisions ?? []} />
}

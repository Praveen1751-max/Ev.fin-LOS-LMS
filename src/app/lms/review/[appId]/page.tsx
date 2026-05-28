import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReviewClient } from './ReviewClient'

export default async function ReviewPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const supabase = await createClient()

  const [{ data: app }, { data: docs }, { data: decisions }] = await Promise.all([
    supabase.from('applications')
      .select('*, fso:profiles!fso_id(name, phone), dealer:dealers(name, city, state)')
      .eq('id', appId)
      .single(),
    supabase.from('documents')
      .select('*')
      .eq('application_id', appId)
      .order('uploaded_at', { ascending: false }),
    supabase.from('credit_decisions')
      .select('*, analyst:profiles!analyst_id(name, role)')
      .eq('application_id', appId)
      .order('decided_at', { ascending: false })
      .limit(10),
  ])

  if (!app) notFound()

  return <ReviewClient app={app} docs={docs ?? []} decisions={decisions ?? []} />
}

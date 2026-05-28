import { createClient } from '@/lib/supabase/server'
import { FsoHomeClient } from './HomeClient'

export default async function FsoHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: applications }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('applications')
      .select('*, dealer:dealers(name)')
      .eq('fso_id', user!.id)
      .order('submitted_at', { ascending: false })
      .limit(20),
  ])

  return <FsoHomeClient profile={profile} applications={applications ?? []} />
}

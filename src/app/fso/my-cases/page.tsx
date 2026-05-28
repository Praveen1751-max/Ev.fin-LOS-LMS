import { createClient } from '@/lib/supabase/server'
import { MyCasesClient } from './MyCasesClient'

export default async function MyCasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: applications }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('applications')
      .select('*, queries(*)')
      .eq('fso_id', user!.id)
      .order('submitted_at', { ascending: false }),
  ])

  return <MyCasesClient profile={profile} applications={applications ?? []} />
}

import { createClient } from '@/lib/supabase/server'
import { WizardClient } from './WizardClient'

export default async function NewLoanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: dealers }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    supabase.from('dealers').select('*').eq('active', true).order('name'),
  ])

  return <WizardClient profile={profile} dealers={dealers ?? []} />
}

import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id ?? '').single()

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Credit Operations</div>
        <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Settings</h1>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Profile</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="label">Name</label>
              <input className="input" defaultValue={profile?.name ?? ''} readOnly style={{ background: 'var(--bg-2, #f8f8f8)' }} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" defaultValue={user?.email ?? ''} readOnly style={{ background: 'var(--bg-2, #f8f8f8)' }} />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" defaultValue={profile?.role ?? ''} readOnly style={{ background: 'var(--bg-2, #f8f8f8)', textTransform: 'capitalize' }} />
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>System</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'SLA Threshold', value: '48 hours' },
              { label: 'Auto-approve CIBIL', value: '720+' },
              { label: 'LTV Cap', value: '90%' },
              { label: 'Region', value: 'West (MH, TS, AP, OD)' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line-2, #f5f5f5)', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-3)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

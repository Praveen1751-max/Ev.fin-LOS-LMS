import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const applicationId = formData.get('application_id') as string | null
  const docType = formData.get('doc_type') as string | null

  if (!file || !applicationId || !docType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${applicationId}/${docType}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

  const { data, error } = await supabase.from('documents').upsert({
    application_id: applicationId,
    doc_type: docType,
    file_url: publicUrl,
    file_name: file.name,
    uploaded_by: user.id,
    uploaded_at: new Date().toISOString(),
    status: 'uploaded',
  }, { onConflict: 'application_id,doc_type' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

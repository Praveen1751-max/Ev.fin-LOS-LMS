import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: app, error } = await supabase
    .from('applications')
    .select('*, dealer:dealers(name, city)')
    .eq('id', params.id)
    .single()

  if (error || !app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { generateSanctionLetterPDF } = await import('@/lib/utils/pdfGenerator')
  const pdfBytes = await generateSanctionLetterPDF(app, true)
  const buffer = Buffer.from(pdfBytes as Uint8Array)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sanction-${app.app_number}.pdf"`,
    },
  })
}

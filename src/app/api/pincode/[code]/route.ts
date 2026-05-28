import { NextResponse } from 'next/server'

const NEGATIVE_PINCODES = ['500032', '534001', '500044']

const PINCODE_DATA: Record<string, { city: string; state: string }> = {
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400051': { city: 'Mumbai', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '440001': { city: 'Nagpur', state: 'Maharashtra' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '500034': { city: 'Hyderabad', state: 'Telangana' },
  '500081': { city: 'Hyderabad', state: 'Telangana' },
  '520001': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha' },
  '500032': { city: 'Hyderabad', state: 'Telangana' },
  '534001': { city: 'Eluru', state: 'Andhra Pradesh' },
  '500044': { city: 'Hyderabad', state: 'Telangana' },
}

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params
  const code = rawCode.trim()

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ eligible: false, known: false, reason: 'Invalid pincode format' })
  }

  if (NEGATIVE_PINCODES.includes(code)) {
    const loc = PINCODE_DATA[code]
    return NextResponse.json({
      eligible: false,
      known: true,
      city: loc?.city,
      state: loc?.state,
      reason: 'This pincode is in a negative area — loan origination not permitted',
    })
  }

  const loc = PINCODE_DATA[code]
  if (loc) {
    return NextResponse.json({ eligible: true, known: true, city: loc.city, state: loc.state })
  }

  // Unknown but not blocked — allow with a note
  return NextResponse.json({ eligible: true, known: false, reason: 'Pincode not in our database — proceeding with manual verification' })
}

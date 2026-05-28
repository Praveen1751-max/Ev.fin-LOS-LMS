'use client'
import { useState, useCallback } from 'react'
import type { PincodeCheck } from '@/lib/types'

export function usePincodeCheck() {
  const [result, setResult] = useState<PincodeCheck | null>(null)
  const [checking, setChecking] = useState(false)

  const check = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) { setResult(null); return }
    setChecking(true)
    try {
      const res = await fetch(`/api/pincode/${pincode}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ eligible: true, known: false })
    } finally {
      setChecking(false)
    }
  }, [])

  const reset = useCallback(() => setResult(null), [])

  return { result, checking, check, reset }
}

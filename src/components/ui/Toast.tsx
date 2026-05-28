'use client'
import { useState, useCallback } from 'react'
import { Check } from 'lucide-react'

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)

  const show = useCallback((message: string, duration = 3200) => {
    setMsg(message)
    setTimeout(() => setMsg(null), duration)
  }, [])

  const node = msg ? (
    <div className="toast">
      <span className="ok"><Check size={12} /></span>
      {msg}
    </div>
  ) : null

  return [node, show] as const
}

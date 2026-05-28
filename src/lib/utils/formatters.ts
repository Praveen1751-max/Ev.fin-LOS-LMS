export const fmtINR = (n: number): string =>
  '₹' + n.toLocaleString('en-IN')

export const fmtINRShort = (n: number): string => {
  if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(2) + ' Cr'
  if (n >= 100_000)    return '₹' + (n / 100_000).toFixed(2) + ' L'
  if (n >= 1_000)      return '₹' + (n / 1_000).toFixed(1) + 'K'
  return '₹' + n
}

export const calcEMI = (principal: number, annualRate: number, months: number): number => {
  const r = annualRate / 12 / 100
  if (r === 0) return Math.round(principal / months)
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1))
}

export const calcTATHours = (submittedAt: string): number =>
  Math.round((Date.now() - new Date(submittedAt).getTime()) / 3_600_000)

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

export const maskAadhaar = (ref: string): string =>
  ref ? `XXXX-XXXX-${ref.slice(-4)}` : 'XXXX-XXXX-XXXX'

export const generateAppNumber = (): string => {
  const seq = Math.floor(4821 + Math.random() * 9999)
  return `EVFIN-2026-0${seq}`
}

export const tatColor = (hours: number): string =>
  hours > 48 ? '#A32D2D' : hours > 24 ? '#BA7517' : '#0F6E56'

export const tatBg = (hours: number): string =>
  hours > 48 ? '#FCEBEB' : hours > 24 ? '#FAEEDA' : '#E1F5EE'

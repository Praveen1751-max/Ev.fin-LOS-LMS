import type { Application } from '@/lib/types'
import { fmtINR, fmtDate } from './formatters'

export async function generateSanctionLetterPDF(app: Application, returnBytes?: false): Promise<void>
export async function generateSanctionLetterPDF(app: Application, returnBytes: true): Promise<Uint8Array>
export async function generateSanctionLetterPDF(app: Application, returnBytes?: boolean): Promise<void | Uint8Array> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  // Header
  doc.setFillColor(15, 110, 86)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ev.fin by Greaves', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Greaves Finance Limited — West Region', 14, 24)
  doc.text(`Sanction Letter — ${app.app_number}`, 14, 31)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)

  let y = 50

  doc.setFont('helvetica', 'bold')
  doc.text('LOAN SANCTION LETTER', 105, y, { align: 'center' })
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, y)
  doc.text(`Ref: ${app.app_number}`, 150, y)
  y += 12

  doc.setFont('helvetica', 'bold')
  doc.text(`Dear ${app.customer_name},`, 14, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const intro = `We are pleased to inform you that your loan application for the purchase of ${app.vehicle_model || 'EV'} (${app.oem.toUpperCase()}) has been sanctioned subject to the terms and conditions mentioned herein.`
  const lines = doc.splitTextToSize(intro, 182)
  doc.text(lines, 14, y)
  y += lines.length * 6 + 8

  const principal = app.loan_amount - app.down_payment
  const processingFee = Math.round(app.loan_amount * 0.02)

  autoTable(doc, {
    startY: y,
    head: [['Loan Parameter', 'Details']],
    body: [
      ['Applicant Name', app.customer_name],
      ['Application No.', app.app_number],
      ['Vehicle', `${app.vehicle_model || 'EV'} — ${app.oem.toUpperCase()}`],
      ['Loan Amount', fmtINR(app.loan_amount)],
      ['Down Payment', fmtINR(app.down_payment)],
      ['Net Loan Amount', fmtINR(principal)],
      ['Rate of Interest', `${app.roi}% p.a. (Reducing Balance)`],
      ['Loan Tenure', `${app.tenure_months} Months`],
      ['EMI Amount', app.emi_amount ? fmtINR(app.emi_amount) : 'As per schedule'],
      ['Processing Fee', fmtINR(processingFee)],
    ],
    headStyles: { fillColor: [15, 110, 86] },
    alternateRowStyles: { fillColor: [240, 248, 245] },
    styles: { fontSize: 10 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Terms & Conditions:', 14, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  const terms = [
    '1. This sanction is valid for 30 days from the date of issue.',
    '2. Disbursement is subject to submission of all required documents.',
    '3. Insurance of the vehicle is mandatory before disbursement.',
    '4. This is a system-generated letter and is valid without physical signature.',
  ]
  terms.forEach(t => { doc.text(t, 14, y); y += 6 })

  y = 265
  doc.setFillColor(15, 110, 86)
  doc.rect(0, y, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text('ev.fin by Greaves Finance Limited | West Region', 105, y + 10, { align: 'center' })
  doc.text('This is a computer-generated document. For queries: support@evfin.in | 1800-XXX-XXXX', 105, y + 18, { align: 'center' })

  if (returnBytes) {
    return doc.output('arraybuffer') as unknown as Uint8Array
  }
  doc.save(`sanction-${app.app_number}.pdf`)
}

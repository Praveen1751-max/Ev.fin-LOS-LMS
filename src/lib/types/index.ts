export type UserRole = 'fso' | 'asm' | 'credit_analyst' | 'rcm' | 'disbursement' | 'admin'
export type AppStatus = 'submitted' | 'under_review' | 'query_raised' | 'referred_to_rcm' | 'approved' | 'rejected' | 'sanctioned' | 'disbursed' | 'cancelled'
export type OEM = 'ather' | 'ola' | 'bajaj' | 'river' | 'ampere' | 'simple'
export type State = 'MH' | 'TS' | 'AP' | 'OD'
export type DocType = 'income_proof' | 'address_proof' | 'bank_statement' | 'vehicle_quotation' | 'selfie' | 'aadhaar' | 'pan' | 'other'

export interface Profile {
  id: string
  name: string
  role: UserRole
  employee_id: string
  phone: string
  state: State
  region: string
  oem_access: OEM[]
  dealer_id?: string
  is_active: boolean
  created_at: string
}

export interface Application {
  id: string
  app_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  dob?: string
  aadhaar_ref?: string
  pan?: string
  pan_number?: string
  kyc_status?: 'pending' | 'verified' | 'failed'
  selfie_url?: string
  has_coapplicant?: boolean
  coapplicant_name?: string
  coapplicant_pan?: string
  oem: OEM
  model?: string
  vehicle_model?: string
  dealer_id?: string
  dealer?: Dealer
  loan_amount: number
  down_payment: number
  tenure_months: number
  roi?: number
  emi?: number
  emi_amount?: number
  ltv_percent?: number
  vehicle_price?: number
  city?: string
  state: State
  pincode?: string
  is_negative_area?: boolean
  status: AppStatus
  fso_id: string
  fso?: Profile
  assigned_analyst_id?: string
  cibil_score?: number
  bureau_status?: string
  submitted_at: string
  review_started_at?: string
  decided_at?: string
  sanctioned_at?: string
  disbursed_at?: string
  created_at?: string
  updated_at?: string
  documents?: Document[]
  queries?: Query[]
  tat_hours?: number
  meta?: Record<string, unknown>
}

export interface Dealer {
  id: string
  name: string
  oem: OEM
  state: State
  city: string
  pincode: string
  bank_name: string
  bank_account: string
  bank_ifsc: string
  contact_name?: string
  contact_phone?: string
}

export interface Document {
  id: string
  application_id: string
  doc_type: DocType
  file_url: string
  file_name?: string
  file_size?: number
  quality_flag?: 'good' | 'recheck' | 'rejected'
  uploaded_by?: string
  uploaded_at: string
}

export interface CreditDecision {
  id: string
  application_id: string
  analyst_id: string
  analyst?: Profile
  action?: 'approve' | 'reject' | 'query' | 'refer_rcm' | 'disburse'
  decision?: string
  reason?: string
  remark?: string
  remarks?: string
  decided_at?: string
  created_at?: string
}

export interface Query {
  id: string
  application_id: string
  raised_by: string
  message: string
  doc_type_requested?: string
  resolved: boolean
  resolved_at?: string
  created_at: string
}

export interface Disbursement {
  id: string
  application_id: string
  officer_id?: string
  dealer_id?: string
  amount: number
  dealer_bank_account?: string
  dealer_bank_ifsc?: string
  insurance_verified: boolean
  rc_confirmed: boolean
  sanction_signed: boolean
  transaction_ref?: string
  status: 'pending' | 'triggered' | 'confirmed' | 'failed'
  triggered_at?: string
  confirmed_at?: string
  created_at: string
}

export interface ActivityLog {
  id: string
  application_id?: string
  actor_id?: string
  actor?: Profile
  action: string
  meta?: Record<string, unknown>
  created_at: string
}

export interface PincodeCheck {
  eligible: boolean
  known: boolean
  city?: string
  state?: string
  reason?: string
}

// ─── Config objects ──────────────────────────────────────────────

export const OEM_CONFIG: Record<OEM, { label: string; color: string; models: string[] }> = {
  ather:  { label: 'Ather',         color: '#1F2C36', models: ['450X Gen 3', '450 Apex', 'Rizta Z'] },
  ola:    { label: 'Ola Electric',  color: '#C60000', models: ['S1 Pro Gen 2', 'S1 X+', 'S1 Air'] },
  bajaj:  { label: 'Bajaj',         color: '#1A4789', models: ['Chetak Premium', 'Chetak Urbane'] },
  river:  { label: 'River Mobility',color: '#0E5E48', models: ['Indie', 'Indie Storm'] },
  ampere: { label: 'Ampere',        color: '#B61F2B', models: ['Magnus EX', 'Primus', 'Nexus'] },
  simple: { label: 'Simple Energy', color: '#1F1F1F', models: ['One', 'Dot One'] },
}

export const STATE_CONFIG: Record<State, { label: string; cities: string[] }> = {
  MH: { label: 'Maharashtra',    cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'] },
  TS: { label: 'Telangana',      cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'] },
  AP: { label: 'Andhra Pradesh', cities: ['Vijayawada', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Kurnool'] },
  OD: { label: 'Odisha',         cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'] },
}

export const STATUS_META: Record<AppStatus, { label: string; color: string; bg: string }> = {
  submitted:       { label: 'Submitted',       color: '#185FA5', bg: '#E6F1FB' },
  under_review:    { label: 'Under Review',    color: '#185FA5', bg: '#E6F1FB' },
  query_raised:    { label: 'Query Raised',    color: '#BA7517', bg: '#FAEEDA' },
  referred_to_rcm: { label: 'Referred to RCM', color: '#534AB7', bg: '#EEEDFE' },
  approved:        { label: 'Approved',        color: '#0F6E56', bg: '#E1F5EE' },
  rejected:        { label: 'Rejected',        color: '#A32D2D', bg: '#FCEBEB' },
  sanctioned:      { label: 'Sanctioned',      color: '#534AB7', bg: '#EEEDFE' },
  disbursed:       { label: 'Disbursed',       color: '#639922', bg: '#EAF3DE' },
  cancelled:       { label: 'Cancelled',       color: '#888888', bg: '#F0F0F0' },
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  income_proof:      'Income Proof',
  address_proof:     'Address Proof',
  bank_statement:    'Bank Statement',
  vehicle_quotation: 'Vehicle Quotation',
  selfie:            'Selfie',
  aadhaar:           'Aadhaar',
  pan:               'PAN',
  other:             'Other',
}

export const NEGATIVE_PINCODES = ['500032', '534001', '500044']

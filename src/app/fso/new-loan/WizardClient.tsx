'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, Dealer } from '@/lib/types'

const T = {
  teal:'#0F6E56',tealD:'#085041',tealL:'#E1F5EE',tealM:'#1D9E75',
  navy:'#042C53',navyL:'#0C447C',
  lime:'#639922',limeL:'#EAF3DE',
  amber:'#BA7517',amberL:'#FAEEDA',
  red:'#A32D2D',redL:'#FCEBEB',
  blue:'#185FA5',blueL:'#E6F1FB',
  coral:'#993C1D',coralL:'#FAECE7',
  bg:'#F7F9F8',white:'#fff',
  text:'#0A1F14',text2:'#4A6358',text3:'#8AA89A',
  border:'#D8EAE3',border2:'#B8D4C8',
  radius:'14px',radiusSm:'8px',
}

const STEPS=[
  {l:'Lead Capture',t:'core',p:'Sourcing'},
  {l:'De-dupe Check',t:'core',p:'Sourcing'},
  {l:'Bureau Consent',t:'rbi',p:'Sourcing'},
  {l:'KYC Verification',t:'core',p:'Verification'},
  {l:'Address Details',t:'core',p:'Verification'},
  {l:'Banking Analysis',t:'core',p:'Verification'},
  {l:'Bureau Check',t:'core',p:'Verification'},
  {l:'Policy Engine (BRE)',t:'core',p:'Underwriting'},
  {l:'Field Investigation',t:'core',p:'Underwriting'},
  {l:'Vehicle & Loan',t:'core',p:'Underwriting'},
  {l:'Credit Decision',t:'core',p:'Underwriting'},
  {l:'Loan Offers',t:'core',p:'Offer'},
  {l:'Key Fact Statement',t:'rbi',p:'Offer'},
  {l:'EMI Confirmation',t:'core',p:'Offer'},
  {l:'Sanction Letter',t:'rbi',p:'Sanction'},
  {l:'References',t:'core',p:'Sanction'},
  {l:'Insurance Consent',t:'rbi',p:'Sanction'},
  {l:'E-Sign & NACH',t:'core',p:'Agreement'},
  {l:'Delivery Order',t:'core',p:'Agreement'},
  {l:'Pre-Disb Docs',t:'core',p:'Disbursal'},
  {l:'Disbursement',t:'core',p:'Disbursal'},
  {l:'PDD & Hypothecation',t:'rbi',p:'Post-Disbursal'},
]

const BTN=['Continue','Run De-dupe','Capture Consent','Continue','Continue','Continue','Continue','Continue','Continue','Continue','Continue','Select Offer','Acknowledge KFS','Confirm EMI','Proceed','Save References','Proceed','Activate','Generate DO','Submit Docs','Disburse','Complete']

// Shared UI
const Card=({children,style}:{children:React.ReactNode;style?:React.CSSProperties})=>(
  <div style={{background:T.white,borderRadius:T.radius,border:`1px solid ${T.border}`,padding:15,marginBottom:11,...style}}>{children}</div>
)
const CardTitle=({children}:{children:React.ReactNode})=>(
  <div style={{fontSize:11,fontWeight:600,color:T.text2,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:11}}>{children}</div>
)
const Fld=({label,req,children}:{label:string;req?:boolean;children:React.ReactNode})=>(
  <div style={{marginBottom:13}}>
    <label style={{fontSize:12,fontWeight:500,color:T.text2,marginBottom:5,display:'block'}}>{label}{req&&<span style={{color:T.red}}> *</span>}</label>
    {children}
  </div>
)
const Inp=(p:React.InputHTMLAttributes<HTMLInputElement>)=>(
  <input style={{width:'100%',height:42,border:`1.5px solid ${T.border2}`,borderRadius:T.radiusSm,padding:'0 12px',fontSize:14,fontFamily:'inherit',color:T.text,background:T.white,outline:'none',...(p.style||{})}} {...p} />
)
const Sel=({children,...p}:React.SelectHTMLAttributes<HTMLSelectElement>)=>(
  <select style={{width:'100%',height:42,border:`1.5px solid ${T.border2}`,borderRadius:T.radiusSm,padding:'0 12px',fontSize:14,fontFamily:'inherit',color:T.text,background:T.white,outline:'none',appearance:'none',...(p.style||{})}} {...p}>{children}</select>
)
const VRow=({title,sub}:{title:string;sub:string})=>(
  <div style={{display:'flex',alignItems:'center',gap:8,background:T.tealL,border:`1.5px solid ${T.teal}`,borderRadius:T.radiusSm,padding:'10px 12px'}}>
    <div style={{width:22,height:22,borderRadius:'50%',background:T.teal,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m5 12 5 5L20 7"/></svg>
    </div>
    <div><div style={{fontSize:13,fontWeight:500,color:T.teal}}>{title}</div><div style={{fontSize:11,color:T.tealD,marginTop:1}}>{sub}</div></div>
  </div>
)
const IRow=({label,value}:{label:React.ReactNode;value:React.ReactNode})=>(
  <div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.bg}`,fontSize:13}}>
    <span style={{color:T.text2}}>{label}</span><span style={{fontWeight:500,color:T.text,textAlign:'right'}}>{value}</span>
  </div>
)
const Rule=({pass,name,detail}:{pass:boolean;name:string;detail:string})=>(
  <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${T.bg}`}}>
    <div style={{width:24,height:24,borderRadius:'50%',background:pass?T.limeL:T.redL,color:pass?T.lime:T.red,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:12}}>{pass?'✓':'✗'}</div>
    <div style={{flex:1}}><div style={{fontSize:13,color:T.text}}>{name}</div><div style={{fontSize:11,color:T.text3}}>{detail}</div></div>
  </div>
)
const Bdg=({color,children}:{color:'green'|'teal'|'amber'|'blue'|'coral';children:React.ReactNode})=>{
  const m:{[k:string]:string[]}={green:[T.limeL,T.lime],teal:[T.tealL,T.teal],amber:[T.amberL,T.amber],blue:[T.blueL,T.blue],coral:[T.coralL,T.coral]}
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 9px',borderRadius:12,fontSize:11,fontWeight:600,background:m[color][0],color:m[color][1]}}>{children}</span>
}
const Tog=({on,onClick,label,sub}:{on:boolean;onClick:()=>void;label:string;sub?:string})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',gap:12}}>
    <div><div style={{fontSize:13,fontWeight:500,color:T.text}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.text3,marginTop:1}}>{sub}</div>}</div>
    <div onClick={onClick} style={{width:44,height:24,borderRadius:12,background:on?T.teal:T.border2,position:'relative',cursor:'pointer',flexShrink:0,transition:'background .25s'}}>
      <div style={{position:'absolute',width:18,height:18,borderRadius:'50%',background:'#fff',top:3,left:3,transform:on?'translateX(20px)':'none',transition:'transform .25s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
    </div>
  </div>
)
const McStg=({av,role,action,status,done,active}:{av:string;role:string;action:string;status:string;done?:boolean;active?:boolean})=>(
  <div style={{display:'flex',alignItems:'center',gap:12,padding:12,borderRadius:T.radiusSm,border:`1.5px solid ${done?T.teal:active?T.amber:T.border}`,marginBottom:9,background:done?T.tealL:active?T.amberL:T.white}}>
    <div style={{width:36,height:36,borderRadius:'50%',background:done?T.teal:active?T.amber:T.border2,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:'#fff',flexShrink:0}}>{av}</div>
    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.text}}>{role}</div><div style={{fontSize:11,color:T.text3,marginTop:1}}>{action}</div></div>
    <Bdg color={done?'green':active?'amber':'teal'}>{status}</Bdg>
  </div>
)
const DocItm=({icon,name,status,up,onClick}:{icon:string;name:string;status:string;up:boolean;onClick:()=>void})=>(
  <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:12,background:up?T.tealL:T.white,border:`1.5px solid ${up?T.teal:T.border}`,borderRadius:T.radiusSm,padding:11,marginBottom:8,cursor:'pointer'}}>
    <div style={{width:34,height:34,borderRadius:8,background:up?T.teal:T.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:up?15:17}}>{up?'✅':icon}</div>
    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:T.text}}>{name}</div><div style={{fontSize:11,color:up?T.teal:T.text3,marginTop:2,fontWeight:up?500:400}}>{status}</div></div>
    {!up&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
  </div>
)
const Head=({title,sub,rbi}:{title:string;sub:string;rbi?:boolean})=>(
  <div style={{marginBottom:16}}>
    <div style={{width:40,height:40,borderRadius:12,background:rbi?T.coralL:T.tealL,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:9}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={rbi?T.coral:T.teal} strokeWidth="1.8"><path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
    </div>
    <div style={{fontSize:19,fontWeight:700,color:T.text,marginBottom:3}}>{title}</div>
    <div style={{fontSize:12,color:T.text2,lineHeight:1.5}}>{sub}</div>
  </div>
)

export function WizardClient({profile,dealers}:{profile:Profile|null;dealers:Dealer[]}) {
  const router=useRouter()
  const [cur,setCur]=useState(0)
  const contentRef=useRef<HTMLDivElement>(null)

  // Step 1
  const [custName,setCustName]=useState('Priya Sharma')
  const [mobile,setMobile]=useState('9876543210')
  const [dob,setDob]=useState('14/08/1992')
  const [email,setEmail]=useState('priya.sharma@gmail.com')
  const [selOem,setSelOem]=useState('Ola')
  const [pincode,setPincode]=useState('411014')
  const [pinStatus,setPinStatus]=useState<'ok'|'bad'|null>(null)

  // Step 2
  const [dedupeLoading,setDedupeLoading]=useState(false)
  const [dedupeShown,setDedupeShown]=useState(false)

  // Step 3
  const [consents,setConsents]=useState([false,false,false])

  // Step 4
  const [aadhaar,setAadhaar]=useState('987654321098')
  const [otpSent,setOtpSent]=useState(false)
  const [otp,setOtp]=useState(['','','','','',''])
  const [aadhaarOk,setAadhaarOk]=useState(false)
  const [pan,setPan]=useState('BAAPC8562Q')
  const [panOk,setPanOk]=useState(false)
  const [selfie,setSelfie]=useState(false)
  const [otpTimer,setOtpTimer]=useState(30)
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null)

  // Step 6
  const [bureauLoading,setBureauLoading]=useState(false)
  const [bureauShown,setBureauShown]=useState(false)

  // Step 10
  const [dp,setDp]=useState(25000)
  const ex=134999; const loan=ex-dp; const ltv=Math.round(loan/ex*100)

  // Step 12
  const [selOffer,setSelOffer]=useState(0)

  // Step 14
  const [emiConsent,setEmiConsent]=useState(false)

  // Step 17
  const [insConsent,setInsConsent]=useState(false)

  // Step 18
  const [eSigned,setESigned]=useState(false)
  const [nachOk,setNachOk]=useState(false)

  // Step 20
  const [docs,setDocs]=useState([false,false,false,false,false])

  // Step 21
  const [disbOk,setDisbOk]=useState(false)

  // Step 22
  const [pdds,setPdds]=useState([false,false,false,false])

  const checkPin=(v:string)=>{setPincode(v);if(v.length===6)setPinStatus(['500032','411032'].includes(v)?'bad':'ok');else setPinStatus(null)}

  const sendOTP=()=>{
    setOtpSent(true);setOtpTimer(30)
    if(timerRef.current)clearInterval(timerRef.current)
    timerRef.current=setInterval(()=>setOtpTimer(t=>{if(t<=1){clearInterval(timerRef.current!);return 0}return t-1}),1000)
  }

  const goNext=()=>{
    if(cur>=21){router.push('/fso/home');return}
    const n=cur+1
    if(n===1&&!dedupeShown){setDedupeLoading(true);setTimeout(()=>{setDedupeLoading(false);setDedupeShown(true)},1800)}
    if(n===6&&!bureauShown){setBureauLoading(true);setTimeout(()=>{setBureauLoading(false);setBureauShown(true)},1800)}
    setCur(n);contentRef.current?.scrollTo(0,0)
  }
  const goPrev=()=>{if(cur>0){setCur(c=>c-1);contentRef.current?.scrollTo(0,0)}}

  const s=STEPS[cur]; const prog=((cur+1)/22)*100

  return (
    <div style={{width:'100%',height:'100dvh',display:'flex',flexDirection:'column',background:T.bg,fontFamily:'DM Sans, sans-serif',maxWidth:430,margin:'0 auto'}}>

      {/* TOPBAR */}
      <div style={{background:T.white,padding:'13px 18px 9px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:T.teal,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,color:'#fff'}}>ev</div>
          <div style={{fontWeight:700,fontSize:15,color:T.navy}}>ev<span style={{color:T.teal}}>.</span>fin</div>
          <div style={{background:T.limeL,color:T.lime,borderRadius:14,padding:'3px 9px',fontSize:9,fontWeight:600,letterSpacing:'.3px'}}>🛡️ Audited</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:T.tealL,borderRadius:20,padding:'3px 9px 3px 3px'}}>
          <div style={{width:20,height:20,borderRadius:'50%',background:T.teal,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff'}}>
            {profile?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()??(profile?.name?.[0]??'R')}
          </div>
          <div style={{fontSize:10,fontWeight:500,color:T.teal}}>{profile?.name?.split(' ')[0]??'Ravi'} · FSO</div>
        </div>
      </div>

      {/* STEP RAIL */}
      <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,padding:'9px 14px 7px',flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
          <div style={{fontSize:11,fontWeight:600,color:T.teal,letterSpacing:'.2px',display:'flex',alignItems:'center',gap:6}}>
            {s.l}
            <span style={{fontSize:8,fontWeight:700,padding:'1px 6px',borderRadius:8,letterSpacing:'.4px',background:s.t==='rbi'?T.coralL:T.tealL,color:s.t==='rbi'?T.coral:T.teal}}>{s.t==='rbi'?'RBI':'CORE'}</span>
          </div>
          <div style={{fontSize:10,color:T.text3}}>{cur+1} / 22</div>
        </div>
        <div style={{height:4,background:T.border,borderRadius:4,overflow:'hidden'}}>
          <div style={{height:'100%',background:`linear-gradient(90deg,${T.tealM},${T.teal})`,borderRadius:4,width:`${prog}%`,transition:'width .4s ease'}}/>
        </div>
        <div style={{fontSize:9,color:T.text3,textTransform:'uppercase',letterSpacing:'.6px',marginTop:5,fontWeight:600}}>Phase: {s.p}</div>
      </div>

      {/* CONTENT */}
      <div ref={contentRef} style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:18}}>

        {/* S1: Lead Capture */}
        {cur===0&&<div>
          <Head title="Lead Capture" sub="Capture customer & loan context to begin"/>
          <Card>
            <CardTitle>Customer Information</CardTitle>
            <Fld label="Full Name" req><Inp value={custName} onChange={e=>setCustName(e.target.value)}/></Fld>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Fld label="Mobile" req><Inp type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} maxLength={10}/></Fld>
              <Fld label="DOB" req><Inp value={dob} onChange={e=>setDob(e.target.value)} placeholder="DD/MM/YYYY"/></Fld>
            </div>
            <Fld label="Email"><Inp type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Fld>
          </Card>
          <Card>
            <CardTitle>Loan Context</CardTitle>
            <Fld label="OEM Brand" req>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                {['Ather','Ola','Bajaj','River','Ampere'].map(o=>(
                  <div key={o} onClick={()=>setSelOem(o)} style={{padding:'6px 13px',borderRadius:20,fontSize:12,fontWeight:500,border:`1.5px solid ${selOem===o?T.teal:T.border2}`,background:selOem===o?T.teal:T.white,color:selOem===o?'#fff':T.text2,cursor:'pointer'}}>{o}</div>
                ))}
              </div>
            </Fld>
            <Fld label="Dealer" req><Sel><option>Ola Experience — Kharadi, Pune</option>{dealers.map(d=><option key={d.id}>{d.name} — {d.city}</option>)}</Sel></Fld>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Fld label="Pincode" req><Inp value={pincode} onChange={e=>checkPin(e.target.value)} maxLength={6} type="tel"/></Fld>
              <Fld label="City"><Inp defaultValue="Pune" readOnly/></Fld>
            </div>
            {pinStatus==='bad'&&<div style={{padding:'8px 10px',background:T.redL,border:`1.5px solid ${T.red}`,borderRadius:8,fontSize:12,color:T.red,fontWeight:500}}>❌ Negative Area — Cannot proceed</div>}
            {pinStatus==='ok'&&<div style={{padding:'8px 10px',background:T.tealL,border:`1.5px solid ${T.teal}`,borderRadius:8,fontSize:12,color:T.teal,fontWeight:500}}>✅ Area Eligible · {pincode}</div>}
          </Card>
        </div>}

        {/* S2: De-dupe */}
        {cur===1&&<div>
          <Head title="De-dupe Check" sub="Screen against existing customers & negative lists"/>
          {dedupeLoading&&<div style={{textAlign:'center',padding:'28px 0'}}>
            <div style={{fontSize:36}}>🔍</div>
            <div style={{fontSize:14,fontWeight:600,marginTop:10}}>Screening applicant...</div>
            <div style={{fontSize:12,color:T.text2,marginTop:4}}>Checking name, mobile, PAN, Aadhaar</div>
            <div style={{marginTop:16,height:4,background:T.border,borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:T.teal,borderRadius:4,width:'80%',transition:'width 1.5s ease'}}/>
            </div>
          </div>}
          {!dedupeLoading&&dedupeShown&&<div>
            <Card style={{border:`1px solid ${T.lime}`,background:T.limeL}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{fontSize:24}}>✅</div>
                <div><div style={{fontSize:13,fontWeight:600,color:T.lime}}>No Match Found — Clear to Proceed</div><div style={{fontSize:11,color:T.text2}}>Applicant is not an existing/rejected customer</div></div>
              </div>
            </Card>
            <Card>
              <CardTitle>Screening Results</CardTitle>
              <Rule pass name="Existing customer match" detail="Name + mobile + PAN cross-check"/>
              <Rule pass name="Internal blacklist" detail="Fraud & NPA register"/>
              <Rule pass name="PEP / Sanctions screening" detail="UN, OFAC, RBI defaulter list"/>
              <Rule pass name="Negative area (pincode)" detail={`${pincode} — Kharadi, Pune`}/>
            </Card>
          </div>}
          {!dedupeLoading&&!dedupeShown&&<div style={{textAlign:'center',padding:'40px 0',color:T.text3,fontSize:13}}>Tap "Run De-dupe" to screen the applicant</div>}
        </div>}

        {/* S3: Bureau Consent */}
        {cur===2&&<div>
          <Head title="Bureau Pull Consent" sub="DPDP Act 2023 — explicit, timestamped consent required" rbi/>
          <Card style={{border:`1.5px solid ${T.coral}`,background:T.coralL}}>
            <div style={{fontSize:11,fontWeight:600,color:T.coral,marginBottom:4}}>⚖️ DPDP ACT 2023 — MANDATORY</div>
            <div style={{fontSize:11,color:T.text2,lineHeight:1.6}}>A recorded, timestamped consent is legally required before any credit bureau enquiry.</div>
          </Card>
          <Card>
            <CardTitle>Customer Consent</CardTitle>
            {[['Credit bureau enquiry','I authorise ev.fin / Greaves Finance to obtain my credit report from CIBIL / CRIF for this loan application.'],['Account Aggregator','I consent to share my bank statement data via the AA framework for income assessment.'],['Data processing & sharing','I consent to processing of my personal data per the Privacy Policy.']].map(([title,body],i)=>(
              <div key={i} onClick={()=>setConsents(c=>c.map((v,j)=>j===i?!v:v))} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:i<2?`1px solid ${T.bg}`:'none',cursor:'pointer'}}>
                <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${consents[i]?T.teal:T.border2}`,background:consents[i]?T.teal:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                  {consents[i]&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m5 12 5 5L20 7"/></svg>}
                </div>
                <div style={{fontSize:12,color:T.text2,lineHeight:1.5}}><strong style={{color:T.text}}>{title}</strong> — {body}</div>
              </div>
            ))}
          </Card>
          <Card style={{background:T.bg,border:'none'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.text3}}><span>Consent captured via</span><span style={{fontWeight:600,color:T.text2}}>OTP + Timestamp</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.text3,marginTop:4}}><span>Logged to consent ledger</span><Bdg color="green">Immutable</Bdg></div>
          </Card>
        </div>}

        {/* S4: KYC */}
        {cur===3&&<div>
          <Head title="KYC Verification" sub="Aadhaar eKYC, PAN, CKYC upload & PEP screening"/>
          <Card>
            <CardTitle>Aadhaar Verification</CardTitle>
            {!aadhaarOk?<>
              <Fld label="Aadhaar Number" req>
                <div style={{display:'flex',gap:8}}>
                  <Inp type="tel" value={aadhaar} onChange={e=>setAadhaar(e.target.value)} maxLength={12}/>
                  <button onClick={sendOTP} style={{height:42,padding:'0 13px',border:`1.5px solid ${T.border2}`,borderRadius:T.radiusSm,background:otpSent?T.tealL:T.bg,fontSize:13,fontWeight:500,color:T.teal,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit'}}>{otpSent?'Resend':'Send OTP'}</button>
                </div>
              </Fld>
              {otpSent&&<>
                <div style={{fontSize:12,fontWeight:500,color:T.text2,marginBottom:8}}>Enter OTP sent to +91 98xxxxx210</div>
                <div style={{display:'flex',gap:8,justifyContent:'center',margin:'12px 0'}}>
                  {otp.map((d,i)=>(
                    <input key={i} value={d} maxLength={1} type="tel"
                      onChange={e=>{const v=e.target.value.slice(-1);setOtp(o=>o.map((x,j)=>j===i?v:x));if(v&&i<5)(document.querySelectorAll('.otpd')[i+1] as HTMLInputElement)?.focus()}}
                      className="otpd"
                      style={{width:42,height:50,border:`2px solid ${d?T.teal:T.border2}`,borderRadius:10,textAlign:'center',fontSize:20,fontWeight:600,outline:'none',background:d?T.tealL:T.white,fontFamily:'inherit'}}
                    />
                  ))}
                </div>
                <div style={{textAlign:'center',fontSize:12,color:T.text3,marginTop:6}}>
                  {otpTimer>0?`Resend in ${otpTimer}s`:<span style={{color:T.teal,cursor:'pointer'}} onClick={sendOTP}>Resend OTP</span>}
                </div>
                <button onClick={()=>setAadhaarOk(true)} style={{width:'100%',marginTop:10,height:40,borderRadius:12,border:'none',background:T.teal,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Verify OTP</button>
              </>}
            </>:<VRow title="Aadhaar Verified · CKYC Updated" sub="XXXX XXXX 1098 · Uploaded to CKYC Registry"/>}
          </Card>
          <Card>
            <CardTitle>PAN Verification</CardTitle>
            {!panOk?<Fld label="PAN Number" req>
              <div style={{display:'flex',gap:8}}>
                <Inp value={pan} onChange={e=>setPan(e.target.value.toUpperCase())} maxLength={10} style={{textTransform:'uppercase'}}/>
                <button onClick={()=>setPanOk(true)} style={{height:42,padding:'0 13px',border:`1.5px solid ${T.border2}`,borderRadius:T.radiusSm,background:T.bg,fontSize:13,fontWeight:500,color:T.teal,cursor:'pointer',fontFamily:'inherit'}}>Verify</button>
              </div>
            </Fld>:<VRow title="PAN Verified · Name Matched" sub="BAAPC8562Q · NSDL Active"/>}
          </Card>
          <Card>
            <CardTitle>Live Photo</CardTitle>
            <div onClick={()=>setSelfie(true)} style={{border:`2px dashed ${selfie?T.teal:T.border2}`,borderRadius:16,padding:22,textAlign:'center',cursor:'pointer',background:selfie?T.tealL:T.bg}}>
              <div style={{fontSize:34,marginBottom:8}}>{selfie?'✅':'📷'}</div>
              <div style={{fontSize:13,fontWeight:500,color:selfie?T.teal:T.text2}}>{selfie?'Selfie Captured · Liveness OK':'Tap to capture selfie (liveness)'}</div>
            </div>
          </Card>
        </div>}

        {/* S5: Address */}
        {cur===4&&<div>
          <Head title="Address Details" sub="Current, permanent & income details"/>
          <Card>
            <CardTitle>Current Address</CardTitle>
            <Fld label="Flat / Building" req><Inp defaultValue="Flat 402, Sunrise Apartments"/></Fld>
            <Fld label="Street / Locality" req><Inp defaultValue="Kharadi Bypass Road"/></Fld>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Fld label="City" req><Inp defaultValue="Pune"/></Fld>
              <Fld label="Pincode" req><Inp defaultValue="411014" maxLength={6}/></Fld>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Fld label="Residence"><Sel><option>Rented</option><option>Owned</option></Sel></Fld>
              <Fld label="Years here"><Sel><option>1-3 yrs</option><option>3-5 yrs</option><option>5+ yrs</option></Sel></Fld>
            </div>
          </Card>
          <Card><Tog on label="Permanent same as current" onClick={()=>{}}/></Card>
          <Card>
            <CardTitle>Income Details</CardTitle>
            <Fld label="Employment" req>
              <div style={{display:'flex',gap:7}}>
                {['Salaried','Self-Employed','Business'].map(e=>(
                  <div key={e} style={{padding:'6px 13px',borderRadius:20,fontSize:12,fontWeight:500,border:`1.5px solid ${e==='Salaried'?T.teal:T.border2}`,background:e==='Salaried'?T.teal:T.white,color:e==='Salaried'?'#fff':T.text2,cursor:'pointer'}}>{e}</div>
                ))}
              </div>
            </Fld>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:13}}>
              <Fld label="Monthly Income" req><Inp defaultValue="₹45,000"/></Fld>
              <Fld label="Employer"><Inp defaultValue="Infosys Ltd"/></Fld>
            </div>
          </Card>
        </div>}

        {/* S6: Banking */}
        {cur===5&&<div>
          <Head title="Banking Analysis" sub="Account Aggregator bank statement assessment"/>
          <Card style={{border:`1px solid ${T.blue}`,background:T.blueL}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{fontSize:22}}>🔗</div>
              <div><div style={{fontSize:13,fontWeight:600,color:T.blue}}>Fetched via Account Aggregator</div><div style={{fontSize:11,color:T.text2}}>SBI · 6 months statement · Consent-based</div></div>
            </div>
          </Card>
          <Card>
            <CardTitle>Banking Behaviour</CardTitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['Avg Balance','₹38,200'],['Salary Credits','₹45,000/mo'],['Cheque Bounces','0'],['Avg Monthly Inflow','₹52,400']].map(([l,v])=>(
                <div key={l} style={{background:T.bg,borderRadius:T.radiusSm,padding:'9px 11px'}}>
                  <div style={{fontSize:10,color:T.text3,marginBottom:3,textTransform:'uppercase',letterSpacing:'.3px'}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:600,color:T.text}}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle>Obligations & FOIR</CardTitle>
            <IRow label="Existing EMIs" value="₹16,200/mo"/>
            <IRow label="Proposed EMI" value="₹3,680/mo"/>
            <IRow label="Total Obligation" value="₹19,880/mo"/>
            <IRow label={<strong>FOIR</strong>} value={<Bdg color="green">44.2% · Within limit</Bdg>}/>
          </Card>
        </div>}

        {/* S7: Bureau */}
        {cur===6&&<div>
          <Head title="Bureau Check" sub="CIBIL / CRIF score & report"/>
          {bureauLoading&&<div style={{textAlign:'center',padding:'28px 0'}}>
            <div style={{fontSize:36}}>⏳</div>
            <div style={{fontSize:14,fontWeight:600,marginTop:10}}>Fetching Bureau Report</div>
            <div style={{fontSize:12,color:T.text2,marginTop:4}}>CIBIL hard enquiry in progress...</div>
            <div style={{marginTop:16,height:4,background:T.border,borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:T.teal,borderRadius:4,width:'80%',transition:'width 1.5s ease'}}/>
            </div>
          </div>}
          {!bureauLoading&&<div>
            <div style={{background:`linear-gradient(135deg,${T.navy} 0%,${T.navyL} 100%)`,borderRadius:T.radius,padding:20,color:'#fff',marginBottom:11}}>
              <div style={{fontSize:10,fontWeight:500,opacity:.7,letterSpacing:'.5px',textTransform:'uppercase',marginBottom:12}}>CIBIL SCORE</div>
              <div style={{fontSize:48,fontWeight:700,lineHeight:1,marginBottom:4}}>724</div>
              <div style={{fontSize:11,opacity:.6,marginBottom:14}}>Range: 300 – 900</div>
              <div style={{height:8,background:'rgba(255,255,255,.15)',borderRadius:4,overflow:'hidden',marginBottom:6}}>
                <div style={{height:'100%',borderRadius:4,background:'linear-gradient(90deg,#F5C242,#27AE60)',width:'57%'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,opacity:.5}}><span>300</span><span>Fair</span><span>Good</span><span>900</span></div>
              <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.12)',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600,marginTop:10}}>⚡ GOOD · Eligible</div>
            </div>
            <Card>
              <CardTitle>Report Summary</CardTitle>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[['Active Loans','2'],['Enquiries 6M','3'],['Overdue A/Cs','0'],['Max DPD 24M','0']].map(([l,v])=>(
                  <div key={l} style={{background:T.bg,borderRadius:T.radiusSm,padding:'9px 11px'}}>
                    <div style={{fontSize:10,color:T.text3,marginBottom:3,textTransform:'uppercase'}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:600,color:T.text}}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>}
        </div>}

        {/* S8: Policy */}
        {cur===7&&<div>
          <Head title="Policy Engine (BRE)" sub="Automated credit policy rule evaluation"/>
          <Card>
            <CardTitle>Hard-Stop Rules</CardTitle>
            <Rule pass name="Age 18-65 at maturity" detail="Applicant: 33 yrs"/>
            <Rule pass name="CIBIL ≥ 680" detail="Score: 724"/>
            <Rule pass name="FOIR ≤ 55%" detail="FOIR: 44.2%"/>
            <Rule pass name="Min income ₹15,000" detail="₹45,000/mo"/>
            <Rule pass name="No DPD > 30 in 12M" detail="Clean record"/>
            <Rule pass name="Geography eligible" detail="Pune, MH — serviceable"/>
          </Card>
          <Card style={{border:`1px solid ${T.lime}`,background:T.limeL}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{fontSize:24}}>✅</div>
              <div><div style={{fontSize:13,fontWeight:600,color:T.lime}}>All Rules Passed — Auto-Eligible</div><div style={{fontSize:11,color:T.text2}}>No deviation required · Proceed to decisioning</div></div>
            </div>
          </Card>
        </div>}

        {/* S9: FI */}
        {cur===8&&<div>
          <Head title="Field Investigation" sub="Residence verification & tele-verification"/>
          <Card>
            <CardTitle>FI Status</CardTitle>
            <McStg av="FI" role="Residence Verification" action="FI Agent · Suresh M · 29 May 11:40 AM" status="Positive" done/>
            <McStg av="TV" role="Tele-Verification" action="Applicant + employer confirmed" status="Verified" done/>
          </Card>
          <Card>
            <CardTitle>FI Report Summary</CardTitle>
            <IRow label="Address matched" value="✓ Yes"/>
            <IRow label="Residence type" value="Rented · 2BHK"/>
            <IRow label="Neighbour confirmation" value="✓ Positive"/>
            <IRow label="Employment verified" value="✓ Infosys Ltd"/>
            <IRow label="Geo-tagged photo" value={<Bdg color="teal">Captured</Bdg>}/>
          </Card>
        </div>}

        {/* S10: Vehicle */}
        {cur===9&&<div>
          <Head title="Vehicle & Loan" sub="Vehicle selection & loan configuration"/>
          <div style={{background:`linear-gradient(135deg,${T.teal} 0%,${T.tealD} 100%)`,borderRadius:T.radius,padding:15,color:'#fff',marginBottom:11}}>
            <div style={{fontSize:10,fontWeight:700,opacity:.7,letterSpacing:'1px',textTransform:'uppercase',marginBottom:3}}>Ola Electric</div>
            <div style={{fontSize:19,fontWeight:700,marginBottom:2}}>S1 Pro Gen 2</div>
            <div style={{fontSize:12,opacity:.8}}>Ex-Showroom · <strong>₹1,34,999</strong></div>
          </div>
          <Card>
            <CardTitle>Loan Configuration</CardTitle>
            <Fld label="Down Payment" req>
              <div style={{display:'flex',alignItems:'center',gap:10,marginTop:4}}>
                <input type="range" min={10000} max={50000} step={2500} value={dp} onChange={e=>setDp(Number(e.target.value))} style={{flex:1}}/>
                <div style={{fontSize:13,fontWeight:700,color:T.teal,minWidth:64,textAlign:'right'}}>₹{dp.toLocaleString('en-IN')}</div>
              </div>
            </Fld>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
              <div style={{fontSize:11,fontWeight:600,color:T.text2}}>Loan Amount</div>
              <div style={{fontSize:18,fontWeight:700,color:T.teal}}>₹{loan.toLocaleString('en-IN')}</div>
            </div>
            <Fld label="LTV" style={{marginTop:10}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',background:ltv>85?T.red:ltv>80?T.amber:T.tealM,borderRadius:3,width:`${ltv}%`}}/>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:T.teal}}>{ltv}%</div>
              </div>
            </Fld>
          </Card>
        </div>}

        {/* S11: Credit Decision */}
        {cur===10&&<div>
          <Head title="Credit Decision" sub="Maker-Checker approval workflow"/>
          <Card>
            <CardTitle>Maker-Checker Trail</CardTitle>
            <McStg av="AV" role="Maker · Credit Analyst" action="Aman Verma · Reviewed & recommended" status="Approved" done/>
            <McStg av="SI" role="Checker · RCM" action="Sneha Iyer · Final approval" status="Sanctioned" done/>
          </Card>
          <Card>
            <CardTitle>Decision Details</CardTitle>
            <IRow label="Sanctioned Amount" value={<span style={{color:T.teal}}>₹1,09,999</span>}/>
            <IRow label="Approved ROI" value="16.5% p.a."/>
            <IRow label="Deviation" value="None"/>
            <IRow label="Decision time" value="29 May · 1:15 PM"/>
          </Card>
          <Card style={{background:T.bg,border:'none'}}>
            <div style={{fontSize:11,color:T.text3,lineHeight:1.5}}>🔒 Dual-control enforced: maker and checker are different users. Both actions logged to immutable audit trail.</div>
          </Card>
        </div>}

        {/* S12: Offers */}
        {cur===11&&<div>
          <Head title="Loan Offers" sub="Select best offer for customer"/>
          <div style={{background:T.navy,borderRadius:T.radiusSm,padding:'11px 13px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
            <div><div style={{fontSize:10,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>Loan</div><div style={{fontSize:15,fontWeight:700,color:'#fff'}}>₹1,09,999</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>CIBIL</div><div style={{fontSize:15,fontWeight:700,color:'#fff'}}>724</div></div>
          </div>
          {[{mo:36,emi:'₹3,680',roi:'16.5%',int:'₹22,481',tot:'₹1.32L',badge:<Bdg color="teal">⭐ Best</Bdg>},{mo:24,emi:'₹5,140',roi:'15.5%',int:'₹13,361',tot:'₹1.23L',badge:<Bdg color="blue">Low Interest</Bdg>},{mo:48,emi:'₹2,890',roi:'17.5%',int:'₹28,721',tot:'₹1.39L',badge:<Bdg color="amber">Low EMI</Bdg>}].map((o,i)=>(
            <div key={i} onClick={()=>setSelOffer(i)} style={{border:`2px solid ${selOffer===i?T.teal:T.border2}`,borderRadius:T.radius,padding:15,background:selOffer===i?T.tealL:T.white,marginBottom:10,cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div style={{fontSize:11,fontWeight:600,color:T.text3}}>{o.mo} MONTHS</div><div style={{fontSize:24,fontWeight:700,color:selOffer===i?T.teal:T.navy}}>{o.emi}<span style={{fontSize:13,fontWeight:500}}>/mo</span></div></div>
                {o.badge}
              </div>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                {[['ROI',o.roi],['Interest',o.int],['Total',o.tot]].map(([l,v])=>(
                  <div key={l} style={{flex:1,background:T.bg,borderRadius:5,padding:7,textAlign:'center'}}>
                    <div style={{fontSize:10,color:T.text3,marginBottom:2}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>}

        {/* S13: KFS */}
        {cur===12&&<div>
          <Head title="Key Fact Statement" sub="RBI mandatory · APR & all-in cost disclosure" rbi/>
          <Card style={{border:`1.5px solid ${T.coral}`,background:T.coralL,padding:'11px 14px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.coral}}>⚖️ RBI MANDATORY (Oct 2024)</div>
            <div style={{fontSize:11,color:T.text2,lineHeight:1.5,marginTop:3}}>KFS must disclose APR (not just ROI), all fees, and be shown before agreement.</div>
          </Card>
          <div style={{background:T.coral,color:'#fff',borderRadius:T.radiusSm,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
            <div><div style={{fontSize:11,opacity:.85}}>Annual Percentage Rate (APR)</div></div>
            <div style={{fontSize:22,fontWeight:700}}>18.74%</div>
          </div>
          <Card>
            <CardTitle>Key Fact Statement</CardTitle>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <tbody>
              {[['Loan amount','₹1,09,999',false],['Nominal interest rate','16.5% p.a.',false],['APR (all-in cost)','18.74% p.a.',true],['Tenure','36 months',false],['Monthly EMI','₹3,680',false],['Processing fee','₹2,499 (2.27%)',false],['Total interest payable','₹22,481',false],['Total cost of loan','₹25,480',false],['Prepayment charges','4% after 12 EMIs',false],['Penal charges','₹500 + GST per default',false],['Grievance officer','grievance@evfin.in',false],['Recovery mechanism','e-NACH auto-debit',false]].map(([k,v,hi])=>(
                <tr key={k as string} style={{background:hi?T.coralL:'transparent'}}>
                  <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,color:T.text2,width:'55%'}}>{k}</td>
                  <td style={{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontWeight:600,color:hi?T.coral:T.text,textAlign:'right'}}>{v}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </Card>
        </div>}

        {/* S14: EMI */}
        {cur===13&&<div>
          <Head title="EMI Confirmation" sub="Review schedule & capture acceptance"/>
          <Card>
            <CardTitle>EMI Schedule (First 6)</CardTitle>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:T.navy}}>{['#','Date','Principal','Interest','EMI'].map(h=><th key={h} style={{padding:'7px 9px',textAlign:'left',fontSize:10,fontWeight:600,color:'#fff'}}>{h}</th>)}</tr></thead>
              <tbody>
                {[[1,'01 Jul','₹2,170','₹1,511'],[2,'01 Aug','₹2,200','₹1,481'],[3,'01 Sep','₹2,230','₹1,451'],[4,'01 Oct','₹2,261','₹1,420'],[5,'01 Nov','₹2,292','₹1,389'],[6,'01 Dec','₹2,324','₹1,357']].map(([n,d,p,i])=>(
                  <tr key={n}><td style={{padding:'7px 9px',borderBottom:`1px solid ${T.border}`}}>{n}</td><td style={{padding:'7px 9px',borderBottom:`1px solid ${T.border}`}}>{d}</td><td style={{padding:'7px 9px',borderBottom:`1px solid ${T.border}`}}>{p}</td><td style={{padding:'7px 9px',borderBottom:`1px solid ${T.border}`}}>{i}</td><td style={{padding:'7px 9px',borderBottom:`1px solid ${T.border}`,fontWeight:700}}>₹3,680</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card><Tog on={emiConsent} onClick={()=>setEmiConsent(v=>!v)} label="Customer accepts EMI terms" sub="Acceptance recorded with timestamp"/></Card>
        </div>}

        {/* S15: Sanction */}
        {cur===14&&<div>
          <Head title="Sanction Letter" sub="Issued with mandatory cooling-off disclosure" rbi/>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:T.radius,padding:16,marginBottom:11,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${T.teal},${T.lime})`}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:11,paddingTop:4}}>
              <div style={{fontSize:15,fontWeight:700,color:T.teal}}>ev.fin</div>
              <div style={{fontSize:10,color:T.text3}}>29 May 2026</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:11,textAlign:'center',borderBottom:`1px dashed ${T.border}`,paddingBottom:9}}>SANCTION LETTER · EVFIN/SL/2026/04821</div>
            {[['Applicant',custName],['Aadhaar','XXXX XXXX 1098'],['Vehicle','Ola S1 Pro Gen 2'],['Sanctioned','₹1,09,999'],['ROI · APR','16.5% · 18.74%'],['Tenure · EMI','36M · ₹3,680']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.bg}`,fontSize:12}}>
                <span style={{color:T.text2}}>{k}</span><span style={{fontWeight:600,color:k==='Sanctioned'?T.teal:T.text}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:T.blueL,border:`1.5px solid ${T.blue}`,borderRadius:T.radiusSm,padding:'12px 14px',marginBottom:11}}>
            <div style={{fontSize:12,fontWeight:600,color:T.blue,marginBottom:5}}>❄️ Cooling-off / Look-up Period</div>
            <div style={{fontSize:11,color:T.text2,lineHeight:1.6}}>Customer may exit this loan within <strong>3 days</strong> of disbursement by repaying principal + proportionate APR, with no prepayment penalty. RBI Digital Lending Guidelines.</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{flex:1,height:38,borderRadius:12,border:`1.5px solid ${T.teal}`,background:T.bg,color:T.teal,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>⬇ Download</button>
            <button style={{flex:1,height:38,borderRadius:12,border:`1.5px solid ${T.teal}`,background:T.bg,color:T.teal,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>✉ Send SMS</button>
          </div>
        </div>}

        {/* S16: References */}
        {cur===15&&<div>
          <Head title="References" sub="Two references for verification"/>
          {[{lbl:'Reference 1',n:'Rajesh Sharma',m:'9812345678',r:'Spouse'},{lbl:'Reference 2',n:'Meena Kapoor',m:'9923456789',r:'Colleague'}].map(r=>(
            <Card key={r.lbl}>
              <CardTitle>{r.lbl}</CardTitle>
              <Fld label="Name" req><Inp defaultValue={r.n}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <Fld label="Mobile" req><Inp type="tel" defaultValue={r.m} maxLength={10}/></Fld>
                <Fld label="Relation"><Sel><option>{r.r}</option><option>Father</option><option>Friend</option></Sel></Fld>
              </div>
            </Card>
          ))}
          <Card style={{border:`1px solid ${T.blue}`,background:T.blueL}}>
            <div style={{fontSize:11,color:T.text2,lineHeight:1.6}}>📞 References will be contacted for a brief verification call within 24 hours.</div>
          </Card>
        </div>}

        {/* S17: Insurance */}
        {cur===16&&<div>
          <Head title="Insurance Consent" sub="IRDAI · separate opt-in, not bundled by default" rbi/>
          <Card style={{border:`1.5px solid ${T.coral}`,background:T.coralL,padding:'11px 14px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.coral}}>⚖️ IRDAI — VOLUNTARY</div>
            <div style={{fontSize:11,color:T.text2,lineHeight:1.5,marginTop:3}}>Insurance cannot be forced. Customer has the right to choose their own insurer.</div>
          </Card>
          <Card>
            <CardTitle>Vehicle Insurance</CardTitle>
            <IRow label="Insurer" value="ICICI Lombard"/>
            <IRow label="Premium (1 yr)" value="₹4,200"/>
            <IRow label="Coverage" value="Comprehensive"/>
            <div style={{borderTop:`1px solid ${T.bg}`,paddingTop:10,marginTop:8}}>
              <Tog on={insConsent} onClick={()=>setInsConsent(v=>!v)} label="Opt for bundled insurance" sub="Customer's voluntary choice"/>
            </div>
          </Card>
          <Card style={{background:T.bg,border:'none'}}>
            <div style={{fontSize:11,color:T.text3,lineHeight:1.5}}>If declined, customer must provide own insurance proof at PDD stage.</div>
          </Card>
        </div>}

        {/* S18: eSign & NACH */}
        {cur===17&&<div>
          <Head title="E-Sign & NACH" sub="Aadhaar eSign + e-NACH mandate setup"/>
          <Card>
            <CardTitle>Loan Agreement — Aadhaar eSign</CardTitle>
            <div onClick={()=>setESigned(true)} style={{border:`2px dashed ${eSigned?T.teal:T.border2}`,borderRadius:12,height:90,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:eSigned?T.tealL:T.bg,marginBottom:11}}>
              {eSigned?<div style={{fontFamily:'cursive',fontSize:30,color:T.tealD}}>Priya Sharma</div>:<div style={{fontSize:13,color:T.text3}}>Tap to initiate Aadhaar eSign</div>}
            </div>
            {eSigned&&<VRow title="E-Signed" sub="Ref: ESIGN0054821 · 3:12 PM"/>}
          </Card>
          <div style={{background:'linear-gradient(135deg,#1A1A3E 0%,#2D1B69 100%)',borderRadius:T.radius,padding:16,color:'#fff',marginBottom:11}}>
            <div style={{fontSize:10,opacity:.6,letterSpacing:'.5px',textTransform:'uppercase',marginBottom:10}}>NACH MANDATE</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:10}}>SBI</div>
              <div><div style={{fontWeight:600,fontSize:13}}>State Bank of India</div><div style={{fontSize:10,opacity:.6}}>A/C XXXX 4821 · SBIN0001234</div></div>
            </div>
            <div style={{fontSize:10,opacity:.6}}>Monthly Debit</div>
            <div style={{fontSize:26,fontWeight:700}}>₹3,680</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(255,255,255,.08)',borderRadius:8,padding:'7px 11px',marginTop:10,fontSize:11}}>
              <span style={{opacity:.6}}>Type</span><span style={{fontWeight:600}}>e-NACH Auto-debit</span>
            </div>
            <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.12)',borderRadius:20,padding:'4px 10px',fontSize:11,marginTop:10}}>
              <span style={{opacity:.6}}>Status:</span><span style={{fontWeight:600}}>{nachOk?'✓ Activated':'Pending'}</span>
            </div>
          </div>
          <Card>
            <CardTitle>NACH Activation</CardTitle>
            <div style={{display:'flex',gap:8}}>
              <Inp defaultValue="50100XXXXX4821"/>
              <button onClick={()=>setNachOk(true)} style={{height:42,padding:'0 13px',border:`1.5px solid ${T.border2}`,borderRadius:T.radiusSm,background:T.bg,fontSize:13,fontWeight:500,color:T.teal,cursor:'pointer',fontFamily:'inherit'}}>Activate</button>
            </div>
            {nachOk&&<div style={{marginTop:10}}><VRow title="NACH Activated" sub="Mandate registered"/></div>}
          </Card>
        </div>}

        {/* S19: DO */}
        {cur===18&&<div>
          <Head title="Delivery Order" sub="DO issued to dealer"/>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:T.radius,padding:15,marginBottom:11,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:10,right:-22,background:T.limeL,color:T.lime,fontSize:8,fontWeight:700,letterSpacing:'1.5px',padding:'3px 28px'}}>DELIVERY ORDER</div>
            <div style={{fontSize:20,fontWeight:700,color:T.navy,marginBottom:4}}>DO/2026/EVFIN/04821</div>
            <div style={{fontSize:11,color:T.text3,marginBottom:11}}>29 May 2026 · Valid 30 days</div>
            {[['Applicant',custName],['Vehicle','Ola S1 Pro Gen 2'],['Dealer','Ola — Kharadi'],['Sanctioned','₹1,09,999'],['DP Collected',`₹${dp.toLocaleString('en-IN')}`]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.bg}`,fontSize:12}}>
                <span style={{color:T.text2}}>{k}</span><span style={{fontWeight:600,color:k==='Sanctioned'?T.teal:T.text}}>{v}</span>
              </div>
            ))}
          </div>
          <Card style={{border:`1px solid ${T.lime}`,background:T.limeL}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:13,fontWeight:600,color:T.lime}}>✅ DO Issued</div>
              <Bdg color="green">Sent to Dealer</Bdg>
            </div>
          </Card>
        </div>}

        {/* S20: Pre-Disb Docs */}
        {cur===19&&<div>
          <Head title="Pre-Disbursement Docs" sub="Mandatory documents before disbursal"/>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <CardTitle>Documents</CardTitle>
              <Bdg color={docs.filter(Boolean).length===5?'green':'amber'}>{docs.filter(Boolean).length} / 5</Bdg>
            </div>
            {[['📋','Signed Loan Agreement'],['🚗','Vehicle Invoice'],['🛡️','Insurance Policy'],['💰','Down Payment Receipt'],['🏦','Cancelled Cheque']].map(([icon,name],i)=>(
              <DocItm key={i} icon={icon} name={name} status={docs[i]?'Uploaded · Just now':'Tap to upload'} up={docs[i]} onClick={()=>setDocs(d=>d.map((v,j)=>j===i?true:v))}/>
            ))}
          </Card>
        </div>}

        {/* S21: Disbursement */}
        {cur===20&&<div>
          <Head title="Disbursement" sub="Dual-control disbursement to dealer"/>
          {!disbOk?<>
            <div style={{background:T.navy,borderRadius:T.radiusSm,padding:'11px 13px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <div><div style={{fontSize:10,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>Amount</div><div style={{fontSize:15,fontWeight:700,color:'#fff'}}>₹1,09,999</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>To</div><div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Ola Kharadi</div></div>
            </div>
            <Card>
              <CardTitle>Maker-Checker</CardTitle>
              <McStg av="DM" role="Maker · Disb Officer" action="Initiated payout" status="Done" done/>
              <McStg av="FH" role="Checker · Finance Head" action="Awaiting approval" status="Pending" active/>
            </Card>
            <Card>
              <CardTitle>Pre-Disbursal Checklist</CardTitle>
              <Tog on label="All docs verified" onClick={()=>{}}/>
              <Tog on label="E-sign & NACH active" onClick={()=>{}}/>
              <Tog on label="Insurance active" onClick={()=>{}}/>
            </Card>
            <button onClick={()=>setDisbOk(true)} style={{width:'100%',height:44,borderRadius:12,border:'none',background:`linear-gradient(135deg,${T.tealM},${T.teal})`,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginBottom:11}}>
              💳 Checker Approve & Disburse
            </button>
          </>:<div style={{textAlign:'center',padding:'18px 0'}}>
            <div style={{width:76,height:76,borderRadius:'50%',background:T.tealL,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2.5"><path d="m5 12 5 5L20 7"/></svg>
            </div>
            <div style={{fontSize:21,fontWeight:700,color:T.text,marginBottom:6}}>Disbursed!</div>
            <div style={{fontSize:12,color:T.text2,lineHeight:1.6,marginBottom:18}}>₹1,09,999 transferred to Ola Experience — Kharadi</div>
            <div style={{background:`linear-gradient(135deg,${T.teal} 0%,${T.tealD} 100%)`,borderRadius:T.radius,padding:15,color:'#fff',textAlign:'left'}}>
              <div style={{fontSize:10,opacity:.7,letterSpacing:'.5px',textTransform:'uppercase',marginBottom:4}}>Transaction Ref</div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:11}}>TXN2026052904821</div>
              {[['Amount','₹1,09,999'],['Mode','RTGS'],['UTR','HDFC2026UTR04821']].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderTop:'1px solid rgba(255,255,255,.15)'}}>
                  <span style={{opacity:.7}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
          </div>}
        </div>}

        {/* S22: PDD */}
        {cur===21&&<div>
          <Head title="PDD & Hypothecation" sub="Post-disbursement docs within 30 days" rbi/>
          <div style={{background:T.amberL,border:`1.5px solid ${T.amber}`,borderRadius:T.radiusSm,padding:'11px 13px',marginBottom:13,display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{fontSize:17,flexShrink:0,marginTop:1}}>⚠️</div>
            <div style={{fontSize:12,color:T.amber,lineHeight:1.5}}><strong style={{fontWeight:600,display:'block',marginBottom:2}}>30-Day Deadline (by 28 Jun 2026)</strong>Critical: RC must be endorsed with ev.fin as hypothecatee.</div>
          </div>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
              <CardTitle>PDD Documents</CardTitle>
              <Bdg color={pdds.filter(Boolean).length===4?'green':'amber'}>{pdds.filter(Boolean).length} / 4</Bdg>
            </div>
            {[['🔑','RC with Hypothecation','ev.fin as hypothecatee · Critical'],['🛡️','Insurance (ev.fin nominee)','Due 28 Jun'],['📸','Delivery Photo','Due 28 Jun'],['📝','Stamped Agreement Copy','Due 28 Jun']].map(([icon,name,status],i)=>(
              <DocItm key={i} icon={icon} name={name} status={pdds[i]?'Submitted · Just now':(status as string)} up={pdds[i]} onClick={()=>setPdds(d=>d.map((v,j)=>j===i?true:v))}/>
            ))}
          </Card>
          <Card>
            <CardTitle>Complete Loan Journey</CardTitle>
            <div style={{position:'relative',paddingLeft:20}}>
              <div style={{position:'absolute',left:6,top:6,bottom:6,width:2,background:T.border}}/>
              {[['Sourced · De-dupe · Consent','9:00 AM',true],['KYC · CKYC · PEP cleared','10:24 AM',true],['Banking · Bureau · BRE passed','11:30 AM',true],['FI positive · Credit approved','1:15 PM',true],['KFS · Sanction · Cooling-off','2:34 PM',true],['eSign · NACH · DO issued','3:30 PM',true],['Disbursed ₹1,09,999 (dual-control)','3:47 PM',true],['PDD pending (RC hypothecation)','Due 28 Jun',false]].map(([l,t,done],i)=>(
                <div key={i} style={{position:'relative',marginBottom:12}}>
                  <div style={{position:'absolute',left:-17,top:4,width:10,height:10,borderRadius:'50%',background:done?T.teal:T.amber,border:`2px solid ${T.white}`,boxShadow:done?'none':`0 0 0 3px rgba(186,117,23,.2)`}}/>
                  <div style={{fontSize:12,fontWeight:600,color:T.text}}>{l}</div>
                  <div style={{fontSize:10,color:T.text3}}>{t}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{textAlign:'center',padding:10}}>
            <div style={{fontSize:15,fontWeight:700,color:T.teal}}>🎉 Compliant Loan Journey Complete</div>
            <div style={{fontSize:11,color:T.text2,marginTop:3}}>EVFIN-2026-04821 · TAT 6h 47m · Fully audited</div>
          </div>
        </div>}

      </div>

      {/* AUDIT STRIP */}
      <div style={{background:T.bg,borderTop:`1px solid ${T.border}`,padding:'5px 14px',fontSize:9,color:T.text3,display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
        <div style={{width:5,height:5,borderRadius:'50%',background:T.lime,flexShrink:0}}/>
        Audit: {s.l} logged · {profile?.name??'FSO'} · {new Date().toLocaleDateString('en-IN')}
      </div>

      {/* BOTTOM BAR */}
      <div style={{background:T.white,borderTop:`1px solid ${T.border}`,padding:'11px 14px',display:'flex',gap:8,flexShrink:0}}>
        <button onClick={goPrev} disabled={cur===0} style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${T.border2}`,background:T.white,display:'flex',alignItems:'center',justifyContent:'center',cursor:cur===0?'not-allowed':'pointer',opacity:cur===0?.3:1,flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button onClick={goNext} style={{flex:1,height:44,borderRadius:12,border:'none',background:`linear-gradient(135deg,${T.tealM} 0%,${T.teal} 100%)`,color:'#fff',fontSize:14,fontWeight:600,fontFamily:'inherit',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:`0 4px 14px rgba(15,110,86,.3)`}}>
          {BTN[cur]}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}

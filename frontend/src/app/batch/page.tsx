'use client'
import { useRef,useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '../../components/Nav'
import { api } from '../../lib/api'

export default function Batch(){const r=useRouter();const ref=useRef<HTMLInputElement>(null);const [cases,setCases]=useState<any[]>([]);const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('')
 async function read(f:File){try{const x=JSON.parse(await f.text());if(!Array.isArray(x))throw new Error();setCases(x);setMsg(`${x.length} cases loaded.`)}catch{setMsg('Invalid JSON. Expected Appendix B input array.')}}
 async function createAll(){setBusy(true);setMsg('Creating kits…');try{for(const c of cases){await api<any>('/kits',{method:'POST',body:JSON.stringify({jd:c.jd,company_url:c.company_url,days:c.days})})}setMsg(`Started ${cases.length} kits.`)}catch(e){setMsg(e instanceof Error?e.message:'Batch create failed')}finally{setBusy(false)}}
 return <><Nav/><main className="max-w-4xl mx-auto p-6"><div className="card p-6 space-y-5"><h1 className="text-3xl font-black">Batch import</h1><p className="text-gray-500">Upload an Appendix B-style JSON array of job-description/company pairs. The same pipeline is used for every case.</p><input ref={ref} hidden type="file" accept="application/json" onChange={e=>e.target.files?.[0]&&read(e.target.files[0])}/><div className="flex gap-3"><button className="btn btn-secondary" onClick={()=>ref.current?.click()}>Choose JSON</button><button disabled={!cases.length||busy} className="btn btn-primary" onClick={createAll}>Start all</button></div>{msg&&<div className="p-3 rounded-lg bg-gray-50 text-sm">{msg}</div>}{cases.length>0&&<div className="space-y-2">{cases.map((c,i)=><div key={c.id||i} className="border rounded-xl p-3"><b>{c.id||`case-${i+1}`}</b> · {c.company_url} · {c.days} days</div>)}</div>}<button className="text-sm underline" onClick={()=>r.push('/dashboard')}>Back to dashboard</button></div></main></>}

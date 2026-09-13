'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
export default function AuthForm({mode}:{mode:'login'|'register'}){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const r=useRouter()
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await api(`/auth/${mode}`,{method:'POST',body:JSON.stringify({email,password})});r.push('/dashboard')}catch(e){setError(e instanceof Error?e.message:'Request failed')}finally{setBusy(false)}}
  return <div className="min-h-screen grid place-items-center p-6"><form onSubmit={submit} className="card p-7 w-full max-w-md space-y-4"><div><div className="text-2xl font-black">{mode==='login'?'Welcome back':'Create your account'}</div><p className="text-sm text-gray-500 mt-1">Interview prep generated from your JD and company research.</p></div><input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><input className="input" placeholder="Password (8+ characters)" type="password" value={password} onChange={e=>setPassword(e.target.value)} />{error&&<div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}<button disabled={busy} className="btn btn-primary w-full">{busy?'Please wait…':mode==='login'?'Sign in':'Register'}</button><button type="button" className="text-sm underline" onClick={()=>r.push(mode==='login'?'/register':'/login')}>{mode==='login'?'Need an account? Register':'Already have an account? Sign in'}</button></form></div>
}

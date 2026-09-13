'use client'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
export default function Nav(){const r=useRouter();return <div className="flex items-center justify-between px-5 py-4 bg-white border-b"><div className="font-black">AI Interview Prep Kit</div><button className="btn btn-secondary" onClick={async()=>{await api('/auth/logout',{method:'POST'});r.push('/login')}}>Logout</button></div>}

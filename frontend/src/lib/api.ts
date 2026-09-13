export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function api<T>(path:string, init:RequestInit={}) : Promise<T> {
  const res=await fetch(`${API}${path}`,{...init,credentials:'include',headers:{'content-type':'application/json',...(init.headers||{})},cache:'no-store'})
  const data=await res.json().catch(()=>({}))
  if(!res.ok) throw new Error(data?.error?.message || 'Request failed')
  return data
}

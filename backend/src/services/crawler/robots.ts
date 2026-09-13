export async function robotsAllows(rawUrl:string):Promise<boolean>{
  try{
    const u=new URL(rawUrl); const robots=new URL('/robots.txt',u.origin)
    const controller=new AbortController(); const t=setTimeout(()=>controller.abort(),5000)
    const res=await fetch(robots,{signal:controller.signal,headers:{'user-agent':'TraoInterviewPrep/1.0'}});clearTimeout(t)
    if(!res.ok)return true
    const text=await res.text(); let active=false; const disallow:string[]=[]
    for(const line of text.split(/\r?\n/)){const [rawK,...rest]=line.split(':');if(!rawK)continue;const k=rawK.trim().toLowerCase(),v=rest.join(':').trim();if(k==='user-agent')active=v==='*';else if(k==='disallow'&&active&&v)disallow.push(v)}
    const path=u.pathname||'/'; return !disallow.some(rule=>path.startsWith(rule))
  }catch{return true}
}

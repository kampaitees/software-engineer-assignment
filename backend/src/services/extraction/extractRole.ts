import { generateJson } from '../generation/llm.js'

export type Requirement = { id:string; text:string; kind:'technical'|'behavioural'|'domain'; priority:'must'|'nice' }
export type ExtractedRole = { title:string; seniority:string; responsibilities:string[]; requirements:Requirement[] }

function fallback(jd:string): ExtractedRole {
  const lines = jd.split(/\n+/).map(s=>s.trim()).filter(Boolean)
  const title = lines[0]?.slice(0,120) || 'Interview Candidate'
  const requirements: Requirement[] = []
  let i=1
  for (const line of lines.slice(1)) {
    if (line.length < 8) continue
    const low = line.toLowerCase()
    const priority: 'must'|'nice' = /nice|bonus|preferred|plus|optional/.test(low) ? 'nice' : 'must'
    const kind = /lead|mentor|stakeholder|communication|collaborat/.test(low) ? 'behavioural' : /domain|industry|healthcare|finance|retail/.test(low) ? 'domain' : 'technical'
    requirements.push({ id:`r${i++}`, text:line.replace(/^[-*•]\s*/,''), kind, priority })
  }
  return { title, seniority:/staff|principal|lead/i.test(jd)?'senior-lead':/senior/i.test(jd)?'senior':/junior/i.test(jd)?'junior':'unspecified', responsibilities:[], requirements:requirements.slice(0,30) }
}

export async function extractRole(jd:string): Promise<ExtractedRole> {
  const fallbackValue = fallback(jd)
  const system = `You extract only explicit information from a job description. Never invent requirements. Distinguish must-have wording from nice-to-have/bonus/preferred wording. Return JSON only.`
  const user = `JOB DESCRIPTION:\n${jd.slice(0,30000)}\n\nReturn {"title":"","seniority":"","responsibilities":[],"requirements":[{"id":"r1","text":"","kind":"technical|behavioural|domain","priority":"must|nice"}]}. Give every requirement a stable id r1,r2... and only include requirements actually supported by the text.`
  const result = await generateJson<ExtractedRole>(system,user,fallbackValue)
  result.requirements = (result.requirements||[]).map((r,i)=>({ ...r, id:`r${i+1}` }))
  return result
}

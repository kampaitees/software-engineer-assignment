import type { Requirement } from '../extraction/extractRole.js'
import type { Question } from '../generation/generateQuestions.js'

export function allocateSchedule(daysAvailable:number, questions:Question[], requirements:Requirement[]) {
  const days = Math.max(1, Math.min(60, Math.floor(daysAvailable)))
  const priority = new Map(requirements.map(r=>[r.id,r.priority]))
  const mustByQuestion = (q:Question) => q.requirement_ids.some(id=>priority.get(id)==='must')
  const sorted = [...questions].sort((a,b)=>{
    const am = mustByQuestion(a)?1:0, bm = mustByQuestion(b)?1:0
    if (am!==bm) return bm-am
    if (a.difficulty!==b.difficulty) return b.difficulty-a.difficulty
    return a.id.localeCompare(b.id)
  })
  const buckets = Array.from({length:days},(_,i)=>({day:i+1,focus:'',question_ids:[] as string[],minutes:0}))
  sorted.forEach((q,i)=>{
    const idx = i % days
    buckets[idx].question_ids.push(q.id)
    buckets[idx].minutes += q.difficulty===3 ? 12 : q.difficulty===2 ? 8 : 5
  })
  const byId = new Map(questions.map(q=>[q.id,q]))
  for (const d of buckets) {
    const qs = d.question_ids.map(id=>byId.get(id)).filter(Boolean) as Question[]
    d.focus = qs.length ? qs.slice(0,2).map(q=>q.category.replace('-', ' ')).join(' + ') : 'Review and reflection'
  }
  return { days_available:days, days:buckets }
}

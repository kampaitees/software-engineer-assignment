import { generateJson } from './llm.js'
import type { Requirement } from '../extraction/extractRole.js'

export type Question = { id:string; requirement_ids:string[]; category:'technical'|'behavioural'|'system-design'|'company-fit'; prompt:string; answer_outline:string; difficulty:number }

function fallback(reqs: Requirement[], category: Question['category'], company: string): Question[] {
  return reqs.map((r,i)=>({
    id:`q-${category}-${i+1}`,
    requirement_ids:[r.id], category,
    prompt: category==='behavioural' ? `Tell me about a time you demonstrated ${r.text}.` : category==='system-design' ? `How would you design a production system that requires ${r.text}? Discuss trade-offs.` : category==='company-fit' ? `Why would you apply your experience with ${r.text} at ${company}?` : `How would you demonstrate strong hands-on experience with ${r.text}?`,
    answer_outline:`Define the requirement, give a concrete example, explain trade-offs and measurable outcomes.`,
    difficulty:r.priority==='must'?Math.max(2, Math.min(3, i%3+1)):1+(i%2)
  }))
}

export async function generateQuestionsForCategory(requirements:Requirement[], category:Question['category'], company:string): Promise<Question[]> {
  const fallbackValue = fallback(requirements,category,company)
  const system = `Generate interview questions only for the supplied requirements. Each question must reference one or more supplied requirement ids. Do not invent requirements. Return JSON only.`
  const user = `COMPANY: ${company}\nCATEGORY: ${category}\nREQUIREMENTS:\n${JSON.stringify(requirements)}\nReturn {"questions":[{"id":"","requirement_ids":[],"category":"${category}","prompt":"","answer_outline":"","difficulty":1}]}. Generate 1-2 strong questions per requirement, concise but realistic.`
  const out = await generateJson<{questions:Question[]}>(system,user,{questions:fallbackValue})
  return (out.questions||[]).map((q,i)=>({ ...q, id:`q${i+1}`, category, difficulty:Math.max(1,Math.min(3,Math.round(q.difficulty||2))), requirement_ids:q.requirement_ids.filter(id=>requirements.some(r=>r.id===id)) })).filter(q=>q.requirement_ids.length)
}

export async function generateFlashcards(requirements: Requirement[], questions: Question[]) {
  const fallback = questions.slice(0,Math.min(24,questions.length)).map((q,i)=>({ id:`f${i+1}`, front:q.prompt, back:q.answer_outline, requirement_ids:q.requirement_ids }))
  const result = await generateJson<{flashcards:Array<{id:string;front:string;back:string;requirement_ids:string[]}>}>(
    'Create concise interview-prep flashcards from the supplied material. Do not add unsupported facts. Return JSON only.',
    `REQUIREMENTS:\n${JSON.stringify(requirements)}\nQUESTIONS:\n${JSON.stringify(questions)}\nReturn {"flashcards":[{"id":"f1","front":"","back":"","requirement_ids":[]}]}.`,
    { flashcards:fallback }
  )
  return (result.flashcards||[]).map((f,i)=>({ ...f, id:`f${i+1}` }))
}

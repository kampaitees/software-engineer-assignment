import { z } from 'zod'

const Requirement = z.object({ id: z.string().min(1), text: z.string(), kind: z.enum(['technical','behavioural','domain']), priority: z.enum(['must','nice']) })
const Question = z.object({ id: z.string().min(1), requirement_ids: z.array(z.string()), category: z.enum(['technical','behavioural','system-design','company-fit']), prompt: z.string(), answer_outline: z.string(), difficulty: z.number().int().min(1).max(3) })
const Flashcard = z.object({ id: z.string().min(1), front: z.string(), back: z.string(), requirement_ids: z.array(z.string()) })
const Day = z.object({ day: z.number().int().positive(), focus: z.string(), question_ids: z.array(z.string()), minutes: z.number().int().nonnegative() })

export const KitSchema = z.object({
  source: z.object({ company:z.string(), company_url:z.string(), role:z.string(), location:z.string(), jd_chars:z.number().int(), researched_at:z.string(), pages_used:z.array(z.string()) }),
  company_brief: z.object({ summary:z.string(), what_they_do:z.string(), sources:z.array(z.string()) }),
  role: z.object({ title:z.string(), seniority:z.string(), responsibilities:z.array(z.string()), requirements:z.array(Requirement) }),
  questions:z.array(Question), flashcards:z.array(Flashcard),
  schedule:z.object({ days_available:z.number().int().positive(), days:z.array(Day) }),
  coverage:z.object({ uncovered_requirement_ids:z.array(z.string()), passes:z.number().int().nonnegative() })
})

export function validateKit(kit: unknown) {
  const parsed = KitSchema.parse(kit)
  const ids = new Set(parsed.questions.map(q => q.id))
  const requirementIds = new Set(parsed.role.requirements.map(r => r.id))
  if (parsed.schedule.days.length !== parsed.schedule.days_available) throw new Error('Schedule must contain exactly days_available days.')
  for (const q of parsed.questions) for (const rid of q.requirement_ids) if (!requirementIds.has(rid)) throw new Error(`Question ${q.id} references missing requirement ${rid}.`)
  for (const d of parsed.schedule.days) for (const qid of d.question_ids) if (!ids.has(qid)) throw new Error(`Schedule references missing question ${qid}.`)
  const mustIds = parsed.role.requirements.filter(r => r.priority === 'must').map(r => r.id)
  const scheduled = new Set(parsed.schedule.days.flatMap(d => d.question_ids).flatMap(qid => parsed.questions.find(q => q.id === qid)?.requirement_ids ?? []))
  const missingScheduled = mustIds.filter(id => !scheduled.has(id))
  if (missingScheduled.length) throw new Error(`Must-have requirements missing from schedule: ${missingScheduled.join(', ')}`)
  return parsed
}

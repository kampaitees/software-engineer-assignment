import type { Requirement } from '../extraction/extractRole.js'
import type { Question } from '../generation/generateQuestions.js'

export function checkCoverage(requirements: Requirement[], questions: Question[]) {
  const covered = new Set(questions.flatMap(q=>q.requirement_ids))
  return requirements.filter(r=>r.priority==='must' && !covered.has(r.id)).map(r=>r.id)
}

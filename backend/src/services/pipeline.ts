import { crawlCompany } from './crawler/crawlSite.js'
import { extractRole } from './extraction/extractRole.js'
import { publicInterviewSearch } from './research/publicSearch.js'
import { generateCompanyBrief } from './generation/generateCompanyBrief.js'
import { generateFlashcards, generateQuestionsForCategory, type Question } from './generation/generateQuestions.js'
import { checkCoverage } from './coverage/checkCoverage.js'
import { allocateSchedule } from './scheduling/allocateSchedule.js'
import { validateKit } from './validator.js'
import { AppError } from '../utils/errors.js'

export type PipelineInput = { jd:string; company_url:string; days:number; onStage?:(stage:string, progress:number)=>Promise<void>|void }

const categories: Array<'technical'|'behavioural'|'system-design'|'company-fit'> = ['technical','behavioural','system-design','company-fit']

export async function runPipeline(input:PipelineInput) {
  const { jd, company_url, days, onStage } = input
  if (!jd || jd.trim().length < 2) throw new AppError(400,'JD_TOO_SHORT','Please provide a job description.')
  if (!Number.isInteger(days) || days < 1 || days > 60) throw new AppError(400,'INVALID_DAYS','Days must be an integer from 1 to 60.')
  await onStage?.('extracting_requirements', 10)
  const role = await extractRole(jd)

  let crawl: Awaited<ReturnType<typeof crawlCompany>> | null = null
  let companyResults: Awaited<ReturnType<typeof publicInterviewSearch>> = []
  const pagesUsed: string[] = []
  let company = new URL(company_url).hostname.replace(/^www\./,'')
  try {
    await onStage?.('researching_company', 20)
    crawl = await crawlCompany(company_url)
    pagesUsed.push(crawl.homepage.url, ...crawl.pages.map(p=>p.url))
    company = crawl.homepage.title || company
  } catch (err) {
    if (err instanceof AppError && ['COMPANY_UNREACHABLE','COMPANY_NOT_FOUND','PRIVATE_URL_BLOCKED','INVALID_URL'].includes(err.code)) throw err
  }
  await onStage?.('researching_interviews', 35)
  companyResults = await publicInterviewSearch(company)
  await onStage?.('building_company_brief', 45)
  const brief = await generateCompanyBrief(company, crawl ? [crawl.homepage,...crawl.pages] : [], companyResults)

  await onStage?.('generating_questions', 55)
  const roleReqs = role.requirements
  const questionGroups = await Promise.all(categories.map(async c => {
    const relevant = roleReqs.filter(r => c==='technical' ? r.kind==='technical' : c==='behavioural' ? r.kind==='behavioural' : c==='company-fit' ? r.priority==='must' : r.kind==='technical')
    if (!relevant.length) return []
    return generateQuestionsForCategory(relevant, c, company)
  }))
  let questions: Question[] = questionGroups.flat().map((q,i)=>({ ...q, id:`q${i+1}` }))

  await onStage?.('coverage_check', 72)
  let uncovered = checkCoverage(roleReqs, questions)
  let passes = 1
  while (uncovered.length && passes < 3) {
    passes++
    await onStage?.(`coverage_pass_${passes}`, 72 + passes*6)
    const missing = roleReqs.filter(r=>uncovered.includes(r.id))
    const extra = await generateQuestionsForCategory(missing, missing.some(r=>r.kind==='behavioural')?'behavioural':'technical', company)
    questions = [...questions, ...extra.map((q,i)=>({ ...q, id:`q${questions.length+i+1}` }))]
    uncovered = checkCoverage(roleReqs, questions)
  }

  await onStage?.('generating_flashcards', 86)
  const flashcards = await generateFlashcards(roleReqs, questions)
  await onStage?.('allocating_schedule', 92)
  const schedule = allocateSchedule(days, questions, roleReqs)
  const kit = {
    source:{ company, company_url, role:role.title, location:'', jd_chars:jd.length, researched_at:new Date().toISOString(), pages_used:[...new Set(pagesUsed)] },
    company_brief:{ ...brief, sources:[...new Set([...pagesUsed, ...companyResults.map(r=>r.url)])] },
    role,
    questions,
    flashcards,
    schedule,
    coverage:{ uncovered_requirement_ids:uncovered, passes }
  }
  await onStage?.('validating', 97)
  const valid = validateKit(kit)
  await onStage?.('completed', 100)
  return valid
}

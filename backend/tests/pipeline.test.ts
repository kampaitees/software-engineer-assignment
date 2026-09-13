import { describe,it,expect } from 'vitest'
import { checkCoverage } from '../src/services/coverage/checkCoverage.js'
import { allocateSchedule } from '../src/services/scheduling/allocateSchedule.js'
import { validateKit } from '../src/services/validator.js'
const reqs:any[]=[{id:'r1',text:'React',kind:'technical',priority:'must'},{id:'r2',text:'Mentoring',kind:'behavioural',priority:'must'},{id:'r3',text:'GraphQL',kind:'technical',priority:'nice'}]
const qs:any[]=[{id:'q1',requirement_ids:['r1'],category:'technical',prompt:'React?',answer_outline:'Explain',difficulty:2},{id:'q2',requirement_ids:['r2'],category:'behavioural',prompt:'Mentoring?',answer_outline:'STAR',difficulty:3}]
describe('coverage checker',()=>it('finds uncovered must-have requirements deterministically',()=>{expect(checkCoverage(reqs,qs)).toEqual([]);expect(checkCoverage(reqs,qs.slice(0,1))).toEqual(['r2'])}))
describe('schedule allocation',()=>it('creates exactly requested number of days and integers',()=>{const s=allocateSchedule(5,qs,reqs);expect(s.days).toHaveLength(5);expect(s.days.every((d:any)=>Number.isInteger(d.minutes))).toBe(true)}))
describe('structure validation',()=>it('rejects unknown scheduled question ids',()=>{expect(()=>validateKit({source:{company:'x',company_url:'https://x.com',role:'x',location:'',jd_chars:1,researched_at:'now',pages_used:[]},company_brief:{summary:'',what_they_do:'',sources:[]},role:{title:'x',seniority:'',responsibilities:[],requirements:reqs},questions:qs,flashcards:[],schedule:{days_available:1,days:[{day:1,focus:'x',question_ids:['q999'],minutes:5}]},coverage:{uncovered_requirement_ids:[],passes:1}})).toThrow(/missing question/)}))

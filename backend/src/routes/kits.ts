import { Router } from 'express'
import { z } from 'zod'
import { KitModel } from '../models/Kit.js'
import { requireAuth } from '../middleware/auth.js'
import { runPipeline } from '../services/pipeline.js'
import { validateKit } from '../services/validator.js'
import { normalize, sha256 } from '../utils/hash.js'
import { AppError } from '../utils/errors.js'

export const kitsRouter = Router()
kitsRouter.use(requireAuth)

const Create = z.object({jd:z.string().min(2).max(100000),company_url:z.string().url(),days:z.number().int().min(1).max(60)})

kitsRouter.get('/', async (req,res,next)=>{try{res.json({kits:await KitModel.find({userId:req.userId}).sort({createdAt:-1}).lean()})}catch(e){next(e)}})

kitsRouter.post('/', async (req,res,next)=>{
  try {
    const b=Create.parse(req.body); const hash=sha256(normalize(b.jd)+'\n'+normalize(b.company_url));
    const existing=await KitModel.findOne({userId:req.userId,dedupeHash:hash}); if(existing) return res.json({kit:existing, reused:true})
    const shell=await KitModel.create({userId:req.userId,dedupeHash:hash,source:{company:'',company_url:b.company_url,role:'',location:'',jd_chars:b.jd.length,researched_at:'',pages_used:[]},company_brief:{summary:'',what_they_do:'',sources:[]},role:{title:'',seniority:'',responsibilities:[],requirements:[]},questions:[],flashcards:[],schedule:{days_available:b.days,days:[]},coverage:{uncovered_requirement_ids:[],passes:0},generationStatus:{status:'processing',stage:'starting',progress:0},practice:[]})
    runPipeline({...b,onStage:async(stage,progress)=>{await KitModel.updateOne({_id:shell._id,userId:req.userId},{$set:{generationStatus:{status:stage==='completed'?'completed':'processing',stage,progress}}})}})
      .then(async kit=>{await KitModel.updateOne({_id:shell._id},{$set:{...kit,generationStatus:{status:'completed',stage:'completed',progress:100}}})})
      .catch(async err=>{await KitModel.updateOne({_id:shell._id},{$set:{generationStatus:{status:'failed',stage:'failed',progress:100,error:{code:err?.code||'GENERATION_FAILED',message:err?.message||'Kit generation failed.'}}}})})
    res.status(202).json({kitId:shell.id})
  }catch(e){next(e)}
})

kitsRouter.get('/:id', async(req,res,next)=>{try{const kit=await KitModel.findOne({_id:req.params.id,userId:req.userId}).lean();if(!kit)throw new AppError(404,'KIT_NOT_FOUND','Kit not found.');res.json({kit})}catch(e){next(e)}})

kitsRouter.patch('/:id', async(req,res,next)=>{try{const body=req.body; const existing=await KitModel.findOne({_id:req.params.id,userId:req.userId});if(!existing)throw new AppError(404,'KIT_NOT_FOUND','Kit not found.'); validateKit({...body}); existing.set(body); await existing.save(); res.json({kit:existing.toObject()})}catch(e){next(e)}})

kitsRouter.post('/:id/regenerate', async(req,res,next)=>{try{const kit=await KitModel.findOne({_id:req.params.id,userId:req.userId}); if(!kit)throw new AppError(404,'KIT_NOT_FOUND','Kit not found.'); const part=z.object({section:z.enum(['company_brief','technical','behavioural','system-design','company-fit','schedule'])}).parse(req.body).section; const original=kit.toObject() as any; if(part==='schedule'){const {allocateSchedule}=await import('../services/scheduling/allocateSchedule.js'); const schedule=allocateSchedule(original.schedule.days_available,original.questions,original.role.requirements); kit.set('schedule',schedule)} else if(part==='company_brief'){const {generateCompanyBrief}=await import('../services/generation/generateCompanyBrief.js'); const {crawlCompany}=await import('../services/crawler/crawlSite.js'); const {publicInterviewSearch}=await import('../services/research/publicSearch.js'); let pages:any[]=[];try{const c=await crawlCompany(original.source.company_url);pages=[c.homepage,...c.pages]}catch{} const results=await publicInterviewSearch(original.source.company||'company'); kit.set('company_brief',{...await generateCompanyBrief(original.source.company||'company',pages,results),sources:original.company_brief.sources||[]})} else { const {generateQuestionsForCategory}=await import('../services/generation/generateQuestions.js'); const cat=part as any; const reqs=original.role.requirements.filter((r:any)=>cat==='technical'?r.kind==='technical':cat==='behavioural'?r.kind==='behavioural':cat==='company-fit'?r.priority==='must':r.kind==='technical'); const generated=await generateQuestionsForCategory(reqs,cat,original.source.company||'company'); const byReq=new Set(reqs.map((r:any)=>r.id)); const edited=(original.questions||[]).filter((q:any)=>q.category===cat && q.state==='edited'); const others=(original.questions||[]).filter((q:any)=>q.category!==cat); const merged=[...others,...edited,...generated.map((q:any,i)=>({...q,id:`q-reg-${Date.now()}-${i+1}`})).filter((q:any)=>!edited.some((e:any)=>e.requirement_ids?.some((id:string)=>q.requirement_ids?.includes(id))))]; kit.set('questions',merged)} await kit.save();res.json({kit:kit.toObject()})}catch(e){next(e)}})

kitsRouter.post('/:id/practice', async(req,res,next)=>{try{const body=z.object({flashcardId:z.string(),confidence:z.number().int().min(1).max(5)}).parse(req.body); const kit=await KitModel.findOne({_id:req.params.id,userId:req.userId});if(!kit)throw new AppError(404,'KIT_NOT_FOUND','Kit not found.'); const practice=(kit.practice||[] as any[]); practice.push({flashcardId:body.flashcardId,confidence:body.confidence,practicedAt:new Date().toISOString()}); kit.set('practice',practice);await kit.save();res.json({ok:true})}catch(e){next(e)}})

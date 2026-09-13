import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { runPipeline } from '../src/services/pipeline.js'

const InputSchema = z.array(z.object({id:z.string(),jd:z.string(),company_url:z.string().url(),days:z.number().int().min(1).max(60)}))
async function main(){
  process.env.EVALUATE_MODE='1'
  const argv=process.argv.slice(2); const inputFlag=argv.indexOf('--input'); const outputFlag=argv.indexOf('--output')
  if(inputFlag<0||outputFlag<0) throw new Error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>')
  const workspaceRoot=path.basename(process.cwd())==='backend' ? path.resolve(process.cwd(),'..') : process.cwd()
  const resolveArgument=(value:string)=>path.isAbsolute(value)?value:path.resolve(workspaceRoot,value)
  const inputPath=resolveArgument(argv[inputFlag+1]); const outputPath=resolveArgument(argv[outputFlag+1])
  const cases=InputSchema.parse(JSON.parse(await fs.readFile(inputPath,'utf8')))
  const kits:any[]=[]
  for(const c of cases){
    try{const kit=await runPipeline({jd:c.jd,company_url:c.company_url,days:c.days}); kits.push({id:c.id,status:'ok',kit,error:null})}
    catch(err:any){kits.push({id:c.id,status:'failed',kit:null,error:{code:err?.code||'PIPELINE_FAILED',message:err?.message||'Pipeline failed.'}})}
  }
  await fs.writeFile(outputPath,JSON.stringify({version:'1.0',generated_at:new Date().toISOString(),kits},null,2)+'\n','utf8')
  console.log(`Wrote ${kits.length} cases to ${outputPath}`)
}
main().catch(err=>{console.error(err);process.exit(1)})

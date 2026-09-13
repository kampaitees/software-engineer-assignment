import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth.js'
import { kitsRouter } from './routes/kits.js'
import { AppError } from './utils/errors.js'
import { env } from './config/env.js'

export const app = express()
app.disable('x-powered-by')
app.use(cors({origin:env.FRONTEND_URL,credentials:true}))
app.use(express.json({limit:'2mb'}))
app.use(cookieParser())
app.get('/health',(_req,res)=>res.json({ok:true,service:'interview-prep-backend'}))
app.use('/auth',authRouter)
app.use('/kits',kitsRouter)
app.use((req,res,next)=>next(new AppError(404,'NOT_FOUND','Endpoint not found.')))
app.use((err:any,_req:any,res:any,_next:any)=>{const status=err?.status||400;res.status(status).json({error:{code:err?.code||'BAD_REQUEST',message:err?.message||'Request failed.'}})})

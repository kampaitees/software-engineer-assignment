import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { UserModel } from '../models/User.js'
import { signSession } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'

export const authRouter = Router()
const Body = z.object({ email:z.string().email(), password:z.string().min(8).max(128) })

const cookieOpts = { httpOnly:true, sameSite:'lax' as const, secure:process.env.NODE_ENV==='production', maxAge:7*24*60*60*1000 }

authRouter.post('/register', async (req,res,next)=>{
  try { const b=Body.parse(req.body); if(await UserModel.exists({email:b.email.toLowerCase()})) throw new AppError(409,'EMAIL_EXISTS','An account with that email already exists.'); const user=await UserModel.create({email:b.email.toLowerCase(),passwordHash:await bcrypt.hash(b.password,12)}); res.cookie('session',signSession(user.id),cookieOpts); res.status(201).json({user:{id:user.id,email:user.email}}) }
  catch(e){next(e)}
})

authRouter.post('/login', async (req,res,next)=>{
  try { const b=Body.parse(req.body); const user=await UserModel.findOne({email:b.email.toLowerCase()}); if(!user||!(await bcrypt.compare(b.password,user.passwordHash))) throw new AppError(401,'BAD_CREDENTIALS','Email or password is incorrect.'); res.cookie('session',signSession(user.id),cookieOpts); res.json({user:{id:user.id,email:user.email}}) }
  catch(e){next(e)}
})

authRouter.post('/logout',(req,res)=>{res.clearCookie('session');res.json({ok:true})})

import mongoose from 'mongoose'
import { app } from './app.js'
import { env } from './config/env.js'

async function start(){ await mongoose.connect(env.MONGODB_URI); app.listen(env.PORT,()=>console.log(`Backend listening on ${env.PORT}`)) }
start().catch(err=>{console.error(err);process.exit(1)})

import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/interview_prep_kit'),
  JWT_SECRET: z.string().min(16).default('development-only-change-me-please'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3-flash-preview'),
  SEARCH_URL: z.string().default('https://html.duckduckgo.com/html/'),
  ALLOW_PRIVATE_FETCH: z.coerce.boolean().default(false),
  MAX_FETCH_BYTES: z.coerce.number().default(2_000_000),
  FETCH_TIMEOUT_MS: z.coerce.number().default(12_000)
})

export const env = EnvSchema.parse(process.env)

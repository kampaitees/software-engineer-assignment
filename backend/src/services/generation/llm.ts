import { env } from '../../config/env.js'
import { withRetry } from '../../utils/retry.js'

export async function generateJson<T>(system: string, user: string, fallback: T): Promise<T> {
  if (!env.GEMINI_API_KEY) return fallback
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`
  return withRetry(async () => {
    const res = await fetch(endpoint, {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role:'user', parts:[{ text:user }] }],
        generationConfig: { responseMimeType:'application/json', temperature:0.2 }
      })
    })
    if (res.status === 429) {
      const err: any = new Error('LLM rate limited.'); err.retryAfterMs = 2000; throw err
    }
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${await res.text()}`)
    const data = await res.json() as any
    const text = data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('')
    if (!text) throw new Error('LLM returned no text.')
    try { return JSON.parse(text) as T } catch { throw new Error('LLM returned invalid JSON.') }
  }, 3)
}

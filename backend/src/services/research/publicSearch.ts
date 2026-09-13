import { env } from '../../config/env.js'
import { withRetry } from '../../utils/retry.js'

export type SearchResult = { title:string; url:string; snippet:string }

export async function publicInterviewSearch(company: string): Promise<SearchResult[]> {
  const queries = [
    `"${company}" interview process`,
    `"${company}" interview questions`,
    `"${company}" engineering interview`,
    `"${company}" hiring process`
  ]
  const results: SearchResult[] = []
  for (const q of queries) {
    try {
      const body = new URLSearchParams({ q, kl:'us-en', no_html:'1', no_cookies:'1' })
      const r = await withRetry(async () => {
        const res = await fetch(env.SEARCH_URL, { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'TraoInterviewPrep/1.0'}, body })
        if (!res.ok) throw new Error(`Search HTTP ${res.status}`)
        return res.text()
      }, 2)
      const { load } = await import('cheerio')
      const $ = load(r)
      $('.result').each((_, el) => {
        const a = $(el).find('.result__a').first(); const url = a.attr('href') || ''; const title = a.text().trim(); const snippet = $(el).find('.result__snippet').text().trim()
        if (url && title && !results.some(x => x.url === url)) results.push({title,url,snippet})
      })
    } catch { /* public search is optional; an empty result is honest */ }
  }
  return results.slice(0, 12)
}

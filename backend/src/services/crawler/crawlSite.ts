import { fetchPage, validateExternalUrl, type FetchedPage } from './fetchPage.js'
import { robotsAllows } from './robots.js'
import { withRetry } from '../../utils/retry.js'

const KEYWORDS: Record<string, number> = { careers:10, career:10, jobs:10, hiring:10, recruitment:8, recruiting:8, handbook:7, engineering:6, about:5, company:4, interview:9, process:9 }

export function scoreLink(href: string, anchor = '') {
  const hay = `${href} ${anchor}`.toLowerCase()
  let score = 0
  for (const [word, pts] of Object.entries(KEYWORDS)) if (hay.includes(word)) score += pts
  return score
}

function absolutize(base: string, href: string) {
  try { return new URL(href, base).toString() } catch { return null }
}

export async function crawlCompany(rawUrl: string): Promise<{ homepage: FetchedPage; pages: FetchedPage[]; skipped: Array<{url:string;reason:string}> }> {
  const base = await validateExternalUrl(rawUrl)
  if (!(await robotsAllows(base.toString()))) throw new Error('robots.txt disallows crawling this site.')
  const skipped: Array<{url:string;reason:string}> = []
  const homepage = await withRetry(() => fetchPage(base.toString()), 3)
  const candidates = homepage.links.map(h => absolutize(homepage.url, h)).filter((x): x is string => Boolean(x)).filter(u => new URL(u).hostname === base.hostname)
  const ranked = [...new Map(candidates.map(u => [u, u])).values()].map(u => ({ url:u, score:scoreLink(u) })).sort((a,b)=>b.score-a.score).slice(0, 8)
  const pages: FetchedPage[] = []
  for (const item of ranked) {
    try { if (!(await robotsAllows(item.url))) { skipped.push({url:item.url,reason:'robots.txt disallows this URL.'}); continue } const page = await withRetry(() => fetchPage(item.url), 2); if (!page.skipped && page.text) pages.push(page) }
    catch (err) { skipped.push({ url:item.url, reason: err instanceof Error ? err.message : 'Unable to retrieve source.' }) }
  }
  return { homepage, pages, skipped }
}
